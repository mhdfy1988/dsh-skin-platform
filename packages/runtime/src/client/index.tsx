/** Browser settings and overlay surfaces for the shared skin runtime. */

import { useRef, useState, useSyncExternalStore } from 'react'
import type { ReactNode } from 'react'
import type { ClientContext, SettingsScope } from '@deepseek-ai/dsh-client-runtime/client'
import type { InjectFace } from '@deepseek-ai/dsh-client-ui-slots'
import type {} from '@deepseek-ai/dsh-client-ui-settings/client'
import type {} from '@deepseek-ai/dsh-client-ui-theme/client'
import type {} from '@deepseek-ai/dsh-client-ui-layout/client'
import type {} from '@deepseek-ai/dsh-client-locale/client'
import {
  DEFAULT_SKIN_ID,
  SKIN_SETTINGS_NAMESPACE,
  type SkinPack,
  type SkinSettings,
} from '../types.ts'
import { SkinRuntime, type CustomBackgroundVisualPatch, type SkinRuntimeSnapshot } from './runtime.js'
import { installStyles } from './styles.js'

export { SkinRuntime, type SkinRuntimeSnapshot } from './runtime.js'
export type * from '../types.ts'

const NS = 'settings.skin-runtime'

const en = {
  nav: 'Skins', kicker: 'SKIN RUNTIME', title: 'Appearance workshop',
  intro: 'Combine installed skin packages, each with its own private background from this device.',
  installed: 'INSTALLED', persistenceHost: 'Saved to Host', persistenceMemory: 'This browser only', persistenceLoading: 'Loading settings',
  motion: 'Ambient motion', defaultName: 'Harness default', defaultDescription: 'Remove the active skin layer and use the official appearance.',
  active: 'ACTIVE', use: 'Use this skin', using: 'In use', restore: 'Restore default', applying: 'Applying…',
  backgroundKicker: 'LOCAL BACKGROUND', backgroundTitle: 'Your backdrop', backgroundLocal: 'LOCAL ONLY',
  backgroundEmpty: 'Choose PNG, JPEG, WebP, GIF, or AVIF up to 25 MB for this skin.', backgroundStored: 'Kept for this skin in the current Harness profile and never bundled with its package.',
  chooseImage: 'Choose image', replaceImage: 'Replace image', removeImage: 'Remove', uploading: 'Saving…', removing: 'Removing…',
  showBackground: 'Show background', fit: 'Fill', cover: 'Cover', contain: 'Contain', position: 'Anchor',
  positionCenter: 'Center', positionTop: 'Top', positionBottom: 'Bottom', positionLeft: 'Left', positionRight: 'Right',
  opacity: 'Image', blur: 'Blur', shade: 'Shade',
} as const

const zh: Record<keyof typeof en, string> = {
  nav: '皮肤', kicker: 'SKIN RUNTIME', title: '外观工坊',
  intro: '组合已安装的皮肤包，并为每套皮肤分别保存本机背景。',
  installed: '已安装', persistenceHost: '已保存到宿主', persistenceMemory: '仅当前浏览器', persistenceLoading: '正在读取设置',
  motion: '环境动效', defaultName: 'Harness 默认', defaultDescription: '释放当前皮肤效果，恢复官方默认外观。',
  active: '使用中', use: '使用此皮肤', using: '当前皮肤', restore: '恢复默认', applying: '切换中…',
  backgroundKicker: '本机背景', backgroundTitle: '我的背景', backgroundLocal: '仅本机',
  backgroundEmpty: '为当前皮肤选择 PNG、JPEG、WebP、GIF 或 AVIF，最大 25 MB。', backgroundStored: '图片只属于当前皮肤，并保存在当前 Harness 配置档案中。',
  chooseImage: '选择图片', replaceImage: '更换图片', removeImage: '移除', uploading: '保存中…', removing: '移除中…',
  showBackground: '显示背景', fit: '填充', cover: '铺满', contain: '完整显示', position: '位置',
  positionCenter: '居中', positionTop: '顶部', positionBottom: '底部', positionLeft: '左侧', positionRight: '右侧',
  opacity: '图片', blur: '模糊', shade: '遮罩',
}

type Key = keyof typeof en

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap {
    /** Skin runtime settings copy. */
    'settings.skin-runtime': Key
  }
}

interface SkinSectionInjected {
  runtime: SkinRuntime
  t(key: Key): string
}

interface SkinOverlayInjected {
  runtime: SkinRuntime
}

type SkinSectionProps = Partial<InjectFace<SkinSectionInjected>>
type SkinOverlayProps = Partial<InjectFace<SkinOverlayInjected>>

/** Required browser services; package edges remain informational only. */
export const inject = ['slots', 'locale', 'settingsScope', 'theme']

/** Provide the runtime and mount its Settings and overlay renderers. */
export function apply(ctx: ClientContext): void {
  installStyles(ctx)
  const settings: SettingsScope<SkinSettings> = ctx.settingsScope.bind({ namespace: SKIN_SETTINGS_NAMESPACE })
  const runtime = new SkinRuntime(ctx, settings, ctx.theme)
  ctx.provide('skinRuntime', runtime)
  ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'skin-runtime: dictionaries')
  const t = ctx.locale.bind(NS) as SkinSectionInjected['t']
  installNavMarker(ctx, t)

  ctx.slots.inject('settings.section', () => ctx.slots.register({
    name: 'settings.section',
    id: 'skins',
    order: 18,
    label: () => t('nav'),
    inject: (): SkinSectionInjected => ({ runtime, t }),
  }, SkinSettingsSection))

  ctx.slots.inject('shell.overlay', () => ctx.slots.register({
    name: 'shell.overlay',
    id: 'skin-runtime-ornament',
    order: 90,
    inject: (): SkinOverlayInjected => ({ runtime }),
  }, SkinOverlay))
}

function installNavMarker(ctx: ClientContext, t: SkinSectionInjected['t']): void {
  ctx.effect(() => {
    if (typeof document === 'undefined') return () => {}
    const attribute = 'data-dsp-skin-nav'
    const scan = (): void => {
      document.querySelectorAll<HTMLElement>(`[${attribute}]`).forEach(element => { element.removeAttribute(attribute) })
      const label = t('nav').trim()
      document.querySelectorAll<HTMLElement>('[role="dialog"] nav button').forEach(button => {
        if (button.textContent?.trim() === label) button.setAttribute(attribute, 'true')
      })
    }
    const observer = new MutationObserver(scan)
    observer.observe(document.documentElement, { childList: true, characterData: true, subtree: true })
    scan()
    return () => {
      observer.disconnect()
      document.querySelectorAll<HTMLElement>(`[${attribute}]`).forEach(element => { element.removeAttribute(attribute) })
    }
  }, 'skin-runtime: settings navigation icon')
}

/** Subscribe one React surface to the runtime snapshot store. */
function useRuntime(runtime: SkinRuntime): SkinRuntimeSnapshot {
  return useSyncExternalStore(
    listener => runtime.subscribe(listener),
    () => runtime.getSnapshot(),
    () => runtime.getSnapshot(),
  )
}

/** Render one selectable catalog card. */
function SkinCard(props: {
  pack: SkinPack | null
  active: boolean
  busy: boolean
  t: SkinSectionInjected['t']
  onSelect: () => void
}): ReactNode {
  const { pack, active, busy, t, onSelect } = props
  const name = pack?.name ?? t('defaultName')
  const description = pack?.description ?? t('defaultDescription')
  return <article className="dsp-card" data-active={active ? 'true' : undefined}>
    <div className={`dsp-preview ${pack === null ? 'dsp-preview-default' : ''}`}>
      {pack === null ? null : <img src={pack.previewUrl} alt="" />}
      {active ? <span className="dsp-active">{t('active')}</span> : null}
    </div>
    <div className="dsp-card-body">
      <div className="dsp-card-meta"><h3>{name}</h3><span className="dsp-version">{pack?.version ?? '0.1.1-rc.2'}</span></div>
      <p>{description}</p>
      <button type="button" disabled={busy || active} onClick={onSelect}>
        {busy ? t('applying') : active ? t('using') : pack === null ? t('restore') : t('use')}
      </button>
    </div>
  </article>
}

/** Render the active skin's profile-local background and compact live controls. */
function BackgroundStudio(props: {
  runtime: SkinRuntime
  snapshot: SkinRuntimeSnapshot
  t: SkinSectionInjected['t']
  onError: (message: string | null) => void
}): ReactNode {
  const { runtime, snapshot, t, onError } = props
  const input = useRef<HTMLInputElement>(null)
  const pendingVisualPatch = useRef<CustomBackgroundVisualPatch | null>(null)
  const [busy, setBusy] = useState<'upload' | 'remove' | null>(null)
  const background = snapshot.customBackground
  const hasImage = snapshot.customBackgroundUrl !== null
  const run = (operation: Promise<void>): void => {
    onError(null)
    void operation.catch((error: unknown) => {
      onError(error instanceof Error ? error.message : String(error))
    })
  }
  const previewVisual = (patch: CustomBackgroundVisualPatch): void => {
    pendingVisualPatch.current = { ...pendingVisualPatch.current, ...patch }
    runtime.previewCustomBackground(patch)
  }
  const persistVisual = (): void => {
    const patch = pendingVisualPatch.current
    if (patch === null) return
    pendingVisualPatch.current = null
    run(runtime.updateCustomBackground(patch))
  }
  const onFile = (file: File | undefined): void => {
    if (file === undefined || busy !== null) return
    setBusy('upload')
    onError(null)
    void runtime.uploadCustomBackground(file).catch((error: unknown) => {
      onError(error instanceof Error ? error.message : String(error))
    }).finally(() => {
      setBusy(null)
      if (input.current !== null) input.current.value = ''
    })
  }
  const remove = (): void => {
    if (busy !== null) return
    setBusy('remove')
    onError(null)
    void runtime.removeCustomBackground().catch((error: unknown) => {
      onError(error instanceof Error ? error.message : String(error))
    }).finally(() => { setBusy(null) })
  }

  return <section className="dsp-background" data-has-image={hasImage ? 'true' : undefined}>
    <div className="dsp-background-preview">
      {snapshot.customBackgroundUrl === null
        ? <div className="dsp-background-empty" aria-hidden="true"><i /><span>DSH</span></div>
        : <img
            src={snapshot.customBackgroundUrl}
            alt=""
            style={{
              objectFit: background.fit,
              objectPosition: background.position,
              opacity: background.opacity,
              filter: `blur(${String(background.blur / 2)}px)`,
            }}
          />}
      <span className="dsp-local-badge">{t('backgroundLocal')}</span>
      {hasImage ? <span className="dsp-preview-shade" style={{ opacity: background.shade }} /> : null}
    </div>
    <div className="dsp-background-body">
      <div className="dsp-background-heading">
        <div><p>{t('backgroundKicker')}</p><h3>{t('backgroundTitle')}</h3></div>
        <div className="dsp-background-actions">
          <input ref={input} type="file" accept="image/png,image/jpeg,image/webp,image/gif,image/avif" hidden onChange={(event) => { onFile(event.currentTarget.files?.[0]) }} />
          <button type="button" disabled={busy !== null} onClick={() => { input.current?.click() }}>
            {busy === 'upload' ? t('uploading') : hasImage ? t('replaceImage') : t('chooseImage')}
          </button>
          {hasImage ? <button type="button" className="dsp-button-quiet" disabled={busy !== null} onClick={remove}>{busy === 'remove' ? t('removing') : t('removeImage')}</button> : null}
        </div>
      </div>
      <p className="dsp-background-note">{hasImage ? t('backgroundStored') : t('backgroundEmpty')}</p>
      {hasImage ? <div className="dsp-background-controls">
        <label className="dsp-switch dsp-background-toggle"><input type="checkbox" checked={background.enabled} disabled={busy !== null} onChange={(event) => { run(runtime.setCustomBackgroundEnabled(event.currentTarget.checked)) }} /><span>{t('showBackground')}</span></label>
        <div className="dsp-control dsp-control-fit"><span>{t('fit')}</span><div>
          <button type="button" data-selected={background.fit === 'cover' ? 'true' : undefined} onClick={() => { run(runtime.updateCustomBackground({ fit: 'cover' })) }}>{t('cover')}</button>
          <button type="button" data-selected={background.fit === 'contain' ? 'true' : undefined} onClick={() => { run(runtime.updateCustomBackground({ fit: 'contain' })) }}>{t('contain')}</button>
        </div></div>
        <label className="dsp-control dsp-control-select"><span>{t('position')}</span><select value={background.position} onChange={(event) => { run(runtime.updateCustomBackground({ position: event.currentTarget.value as typeof background.position })) }}>
          <option value="center">{t('positionCenter')}</option><option value="top">{t('positionTop')}</option><option value="bottom">{t('positionBottom')}</option><option value="left">{t('positionLeft')}</option><option value="right">{t('positionRight')}</option>
        </select></label>
        <label className="dsp-control dsp-control-range"><span>{t('opacity')}<b>{Math.round(background.opacity * 100)}%</b></span><input type="range" min="15" max="100" value={Math.round(background.opacity * 100)} onChange={(event) => { previewVisual({ opacity: Number(event.currentTarget.value) / 100 }) }} onPointerUp={persistVisual} onPointerCancel={persistVisual} onBlur={persistVisual} onKeyUp={persistVisual} /></label>
        <label className="dsp-control dsp-control-range"><span>{t('blur')}<b>{background.blur}px</b></span><input type="range" min="0" max="24" value={background.blur} onChange={(event) => { previewVisual({ blur: Number(event.currentTarget.value) }) }} onPointerUp={persistVisual} onPointerCancel={persistVisual} onBlur={persistVisual} onKeyUp={persistVisual} /></label>
        <label className="dsp-control dsp-control-range"><span>{t('shade')}<b>{Math.round(background.shade * 100)}%</b></span><input type="range" min="0" max="85" value={Math.round(background.shade * 100)} onChange={(event) => { previewVisual({ shade: Number(event.currentTarget.value) / 100 }) }} onPointerUp={persistVisual} onPointerCancel={persistVisual} onBlur={persistVisual} onKeyUp={persistVisual} /></label>
      </div> : null}
    </div>
  </section>
}

/** Render the dedicated skin catalog and selection controls. */
export function SkinSettingsSection({ runtime, t }: SkinSectionProps): ReactNode {
  if (runtime === undefined || t === undefined) return null
  return <LoadedSettings runtime={runtime} t={t} />
}

function LoadedSettings({ runtime, t }: SkinSectionInjected): ReactNode {
  const snapshot = useRuntime(runtime)
  const [busy, setBusy] = useState<string | null>(null)
  const [localError, setLocalError] = useState<string | null>(null)
  const select = (id: string | null): void => {
    if (busy !== null) return
    setBusy(id ?? DEFAULT_SKIN_ID)
    setLocalError(null)
    void runtime.select(id).catch((error: unknown) => {
      setLocalError(error instanceof Error ? error.message : String(error))
    }).finally(() => { setBusy(null) })
  }
  const persistence = snapshot.persistence === 'host'
    ? t('persistenceHost')
    : snapshot.persistence === 'memory' ? t('persistenceMemory') : t('persistenceLoading')

  return <div className="dsp-settings">
    <section className="dsp-hero">
      <div><p className="dsp-kicker">{t('kicker')}</p><h2 className="dsp-title">{t('title')}</h2><p className="dsp-intro">{t('intro')}</p></div>
      <div className="dsp-count"><strong>{snapshot.packs.length}</strong><span>{t('installed')}</span></div>
    </section>
    <div className="dsp-toolbar">
      <span className="dsp-status"><i />{persistence}</span>
      <label className="dsp-switch"><input type="checkbox" checked={snapshot.motionEnabled} onChange={(event) => { void runtime.setMotionEnabled(event.currentTarget.checked) }} /><span>{t('motion')}</span></label>
    </div>
    {snapshot.error === null && localError === null ? null : <div className="dsp-alert" role="alert">{localError ?? snapshot.error}</div>}
    <BackgroundStudio runtime={runtime} snapshot={snapshot} t={t} onError={setLocalError} />
    <div className="dsp-grid">
      <SkinCard pack={null} active={snapshot.activeSkinId === null} busy={busy !== null} t={t} onSelect={() => { select(null) }} />
      {snapshot.packs.map(pack => <SkinCard key={pack.id} pack={pack} active={snapshot.activeSkinId === pack.id} busy={busy !== null} t={t} onSelect={() => { select(pack.id) }} />)}
    </div>
  </div>
}

/** Render the active skin's optional non-interactive frame ornament. */
export function SkinOverlay({ runtime }: SkinOverlayProps): ReactNode {
  if (runtime === undefined) return null
  return <LoadedOverlay runtime={runtime} />
}

function LoadedOverlay({ runtime }: SkinOverlayInjected): ReactNode {
  const snapshot = useRuntime(runtime)
  const overlay = snapshot.activePack?.overlay
  if (overlay === undefined) return null
  return <div className="dsp-overlay" data-side={overlay.side} aria-hidden="true">
    <div className="dsp-orbit" />
    <div className="dsp-sigil"><span className="dsp-monogram">{overlay.monogram}</span><span className="dsp-sigil-copy"><small>{overlay.eyebrow}</small><strong>{overlay.title}</strong></span></div>
  </div>
}
