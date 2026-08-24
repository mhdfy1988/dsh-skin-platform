/** Browser runtime that owns the installed-skin registry and exactly one active visual layer. */

import type { Context } from '@deepseek-ai/cordis'
import type { ClientContext, SettingsScope } from '@deepseek-ai/dsh-client-runtime/client'
import type { ThemeRuntime } from '@deepseek-ai/dsh-client-ui-theme/client'
import type {} from '@deepseek-ai/dsh-client-ui-theme/client'
import {
  CUSTOM_BACKGROUND_ROUTE,
  DEFAULT_SKIN_ID,
  SKIN_API_VERSION,
  defaultCustomBackground,
  type CustomBackgroundSettings,
  type SkinPack,
  type SkinSettings,
  type SkinTokenOverrides,
} from '../types.ts'

const ACTIVE_TOKEN_SOURCE = 'dsh-skin-runtime/active'
const SKIN_ID_PATTERN = /^[a-z][a-z0-9-]*$/
const BODY_PROPERTIES = [
  '--dsp-skin-background-image',
  '--dsp-skin-background-position',
  '--dsp-skin-accent',
  '--dsp-skin-glow',
  '--dsp-skin-font-family',
  'color-scheme',
] as const
const CUSTOM_BACKGROUND_PROPERTIES = [
  '--dsp-custom-background-image',
  '--dsp-custom-background-position',
  '--dsp-custom-background-size',
  '--dsp-custom-background-opacity',
  '--dsp-custom-background-blur',
  '--dsp-custom-background-shade',
] as const
const COLOR_SCHEMES = new Set(['adaptive', 'fixed-light', 'fixed-dark'])

/** Display-only fields changed by the background controls. */
export type CustomBackgroundVisualPatch = Partial<Pick<
  CustomBackgroundSettings,
  'fit' | 'position' | 'opacity' | 'blur' | 'shade'
>>

/** Immutable browser state consumed by Settings and overlay renderers. */
export interface SkinRuntimeSnapshot {
  /** Monotonic catalog or selection revision. */
  revision: number
  /** Active package id, or null for the default Harness appearance. */
  activeSkinId: string | null
  /** Active full definition used by the overlay renderer. */
  activePack: SkinPack | null
  /** Installed skin definitions in stable display order. */
  packs: readonly SkinPack[]
  /** Whether ambient package motion may run. */
  motionEnabled: boolean
  /** User-owned background settings detached from the Host snapshot. */
  customBackground: Readonly<CustomBackgroundSettings>
  /** Current cache-busted local asset URL, whether displayed or temporarily disabled. */
  customBackgroundUrl: string | null
  /** Host settings availability. */
  persistence: 'loading' | 'host' | 'memory'
  /** Last activation or compatibility problem. */
  error: string | null
}

declare module '@deepseek-ai/cordis' {
  interface Context {
    /** Shared declarative skin registry and selection controller. */
    skinRuntime: SkinRuntime
  }
}

/** Validate the stable package protocol before any UI or theme effect is installed. */
function validatePack(pack: SkinPack): void {
  if (pack.apiVersion !== SKIN_API_VERSION) {
    throw new TypeError(`skin ${JSON.stringify(pack.id)} uses unsupported API version ${String(pack.apiVersion)}`)
  }
  if (!SKIN_ID_PATTERN.test(pack.id)) {
    throw new TypeError(`skin id ${JSON.stringify(pack.id)} must match ${String(SKIN_ID_PATTERN)}`)
  }
  if (pack.name.trim().length === 0 || pack.version.trim().length === 0) {
    throw new TypeError(`skin ${JSON.stringify(pack.id)} must declare a name and version`)
  }
  if (!COLOR_SCHEMES.has(pack.colorScheme)) {
    throw new TypeError(`skin ${JSON.stringify(pack.id)} has invalid color scheme ${JSON.stringify(pack.colorScheme)}`)
  }
  const expectedPrefix = `/skin-assets/${pack.id}/`
  if (!pack.previewUrl.startsWith(expectedPrefix) || !pack.appearance.backgroundUrl.startsWith(expectedPrefix)) {
    throw new TypeError(`skin ${JSON.stringify(pack.id)} assets must use ${JSON.stringify(expectedPrefix)}`)
  }
  for (const [token, modes] of Object.entries(pack.tokens)) {
    if (!token.startsWith('--') || typeof modes.light !== 'string' || typeof modes.dark !== 'string') {
      throw new TypeError(`skin ${JSON.stringify(pack.id)} has invalid theme token ${JSON.stringify(token)}`)
    }
  }
}

/** Resolve one package into the official per-mode override format without changing the user's preference. */
export function resolveSkinTokenOverrides(pack: SkinPack): SkinTokenOverrides {
  if (pack.colorScheme === 'adaptive') return pack.tokens
  const selectedMode = pack.colorScheme === 'fixed-dark' ? 'dark' : 'light'
  return Object.fromEntries(Object.entries(pack.tokens).map(([name, modes]) => {
    const value = modes[selectedMode]
    return [name, { light: value, dark: value }]
  }))
}

/** Clone the declarative definition so later caller mutation cannot affect the active skin. */
function freezePack(pack: SkinPack): SkinPack {
  const tokens = Object.freeze(Object.fromEntries(
    Object.entries(pack.tokens).map(([name, modes]) => [name, Object.freeze({ ...modes })]),
  ))
  return Object.freeze({
    ...pack,
    tokens,
    appearance: Object.freeze({ ...pack.appearance }),
    ...(pack.overlay === undefined ? {} : { overlay: Object.freeze({ ...pack.overlay }) }),
  })
}

/** Shared browser skin runtime. */
export class SkinRuntime {
  private readonly packs = new Map<string, SkinPack>()
  private readonly listeners = new Set<() => void>()
  private snapshot: SkinRuntimeSnapshot
  private revision = 0
  private desiredSkinId = DEFAULT_SKIN_ID
  private activePack: SkinPack | null = null
  private motionEnabled = true
  private customBackgrounds: Record<string, CustomBackgroundSettings> = {}
  private customBackground = defaultCustomBackground()
  private customBackgroundPreviewActive = false
  private pendingCustomBackgroundWrites = 0
  private customBackgroundWriteTail: Promise<void> = Promise.resolve()
  private persistence: SkinRuntimeSnapshot['persistence'] = 'loading'
  private error: string | null = null
  private disposeTokens: (() => void) | undefined
  private disposed = false

  /** Bind durable settings and own all active browser effects. */
  constructor(
    private readonly ctx: ClientContext,
    private readonly settings: SettingsScope<SkinSettings>,
    private readonly theme: ThemeRuntime,
  ) {
    this.snapshot = this.buildSnapshot()
    ctx.effect(() => settings.subscribe(() => { this.adoptSettings() }), 'skin-runtime: settings subscription')
    ctx.effect(() => () => { this.dispose() }, 'skin-runtime: active visual lifetime')
    this.adoptSettings()
  }

  /** Read the current immutable state. */
  getSnapshot(): SkinRuntimeSnapshot {
    return this.snapshot
  }

  /** Subscribe to registry and selection changes. */
  subscribe(listener: () => void): () => void {
    this.listeners.add(listener)
    return () => { this.listeners.delete(listener) }
  }

  /**
   * Register one independently installed declarative skin package.
   * @param definition - package-owned immutable visual description.
   * @returns disposer removing exactly this registration.
   */
  register(definition: SkinPack): () => void {
    if (this.disposed) throw new Error('skin runtime is disposed')
    validatePack(definition)
    if (this.packs.has(definition.id)) throw new Error(`skin ${JSON.stringify(definition.id)} is already registered`)
    const pack = freezePack(definition)
    this.packs.set(pack.id, pack)
    this.reconcileDesired()
    this.publish()
    return () => {
      if (this.packs.get(pack.id) !== pack) return
      this.packs.delete(pack.id)
      this.reconcileDesired()
      this.publish()
    }
  }

  /** Select one installed skin, or null for the default Harness appearance. */
  async select(id: string | null): Promise<void> {
    const desired = id ?? DEFAULT_SKIN_ID
    if (desired !== DEFAULT_SKIN_ID && !this.packs.has(desired)) {
      throw new Error(`skin ${JSON.stringify(desired)} is not installed`)
    }
    this.desiredSkinId = desired
    this.customBackgroundPreviewActive = false
    this.customBackground = this.resolveCustomBackground(desired)
    this.error = null
    this.reconcileDesired()
    this.applyCustomBackground()
    this.publish()
    await this.settings.set('activeSkinId', desired)
  }

  /** Enable or disable ambient motion and persist the preference. */
  async setMotionEnabled(enabled: boolean): Promise<void> {
    this.motionEnabled = enabled
    this.applyMotionAttribute()
    this.publish()
    await this.settings.set('motionEnabled', enabled)
  }

  /** Upload one local raster image, display it immediately, and persist its revision. */
  async uploadCustomBackground(file: File): Promise<void> {
    const skinId = this.desiredSkinId
    const response = await fetch(customBackgroundRoute(skinId), {
      method: 'POST',
      headers: { 'Content-Type': file.type || 'application/octet-stream' },
      body: file,
    })
    if (!response.ok) throw new Error(await readResponseError(response, '背景图片保存失败。'))
    const stored = parseStoredBackground(await response.json())
    await this.commitCustomBackground(skinId, {
      ...this.customBackground,
      enabled: true,
      revision: stored.revision,
    })
  }

  /** Show or hide the stored image without deleting it. */
  async setCustomBackgroundEnabled(enabled: boolean): Promise<void> {
    if (enabled && this.customBackground.revision.length === 0) {
      throw new Error('请先选择一张背景图片。')
    }
    await this.commitCustomBackground(this.desiredSkinId, { ...this.customBackground, enabled })
  }

  /** Apply visual-control movement immediately without writing the Host settings field. */
  previewCustomBackground(patch: CustomBackgroundVisualPatch): void {
    this.customBackgroundPreviewActive = true
    this.customBackground = { ...this.customBackground, ...patch }
    this.applyCustomBackground()
    this.publish()
  }

  /** Apply and persist one group of visual controls. */
  async updateCustomBackground(patch: CustomBackgroundVisualPatch): Promise<void> {
    await this.commitCustomBackground(this.desiredSkinId, { ...this.customBackground, ...patch })
  }

  /** Reset the setting first, then remove exactly the local runtime-owned file. */
  async removeCustomBackground(): Promise<void> {
    const skinId = this.desiredSkinId
    await this.commitCustomBackground(skinId, defaultCustomBackground())
    const response = await fetch(customBackgroundRoute(skinId), { method: 'DELETE' })
    if (!response.ok) throw new Error(await readResponseError(response, '本地背景文件未能删除。'))
  }

  /** Adopt the latest Host-backed preference snapshot. */
  private adoptSettings(): void {
    const snapshot = this.settings.getSnapshot()
    this.persistence = snapshot.mode === 'host'
      ? (snapshot.value === undefined ? 'loading' : 'host')
      : 'memory'
    const value = snapshot.value
    if (value !== undefined) {
      this.desiredSkinId = value.activeSkinId
      this.motionEnabled = value.motionEnabled
      if (!this.customBackgroundPreviewActive && this.pendingCustomBackgroundWrites === 0) {
        this.customBackgrounds = cloneCustomBackgrounds(value.customBackgrounds)
        this.customBackground = this.resolveCustomBackground(this.desiredSkinId)
      }
      this.applyMotionAttribute()
      this.reconcileDesired()
      this.applyCustomBackground()
    }
    this.publish()
  }

  /** Resolve the durable id against the current installed registry. */
  private reconcileDesired(): void {
    if (this.desiredSkinId === DEFAULT_SKIN_ID) {
      this.releaseVisual()
      this.error = null
      return
    }
    const pack = this.packs.get(this.desiredSkinId)
    if (pack === undefined) {
      this.releaseVisual()
      this.error = `已保存的皮肤“${this.desiredSkinId}”尚未安装。`
      return
    }
    if (this.activePack === pack) return
    try {
      this.applyPack(pack)
      this.error = null
    } catch (caught) {
      this.releaseVisual()
      this.error = caught instanceof Error ? caught.message : String(caught)
    }
  }

  /** Install one already-validated visual layer after releasing its predecessor. */
  private applyPack(pack: SkinPack): void {
    this.releaseVisual()
    this.disposeTokens = this.theme.overrideTokens(ACTIVE_TOKEN_SOURCE, resolveSkinTokenOverrides(pack))
    this.activePack = pack
    if (typeof document !== 'undefined') {
      const body = document.body
      body.dataset.dshSkin = pack.id
      body.dataset.dshSkinColorScheme = pack.colorScheme
      body.style.setProperty('--dsp-skin-background-image', `url("${pack.appearance.backgroundUrl}")`)
      body.style.setProperty('--dsp-skin-background-position', pack.appearance.backgroundPosition)
      body.style.setProperty('--dsp-skin-accent', pack.appearance.accent)
      body.style.setProperty('--dsp-skin-glow', pack.appearance.glow)
      body.style.setProperty('--dsp-skin-font-family', pack.appearance.fontFamily)
      if (pack.colorScheme === 'adaptive') body.style.removeProperty('color-scheme')
      else body.style.setProperty('color-scheme', pack.colorScheme === 'fixed-dark' ? 'dark' : 'light')
      this.applyMotionAttribute()
    }
  }

  /** Remove all visual effects owned by the active package. */
  private releaseVisual(): void {
    this.disposeTokens?.()
    this.disposeTokens = undefined
    this.activePack = null
    if (typeof document === 'undefined') return
    delete document.body.dataset.dshSkin
    delete document.body.dataset.dshSkinColorScheme
    delete document.body.dataset.dshSkinMotion
    for (const property of BODY_PROPERTIES) document.body.style.removeProperty(property)
  }

  /** Project the current motion preference to the runtime-owned body attribute. */
  private applyMotionAttribute(): void {
    if (typeof document === 'undefined' || this.activePack === null) return
    document.body.dataset.dshSkinMotion = this.motionEnabled ? 'true' : 'false'
  }

  /** Project the user image above package backgrounds while leaving theme tokens and ornaments intact. */
  private applyCustomBackground(): void {
    if (typeof document === 'undefined') return
    const body = document.body
    const background = this.customBackground
    if (!background.enabled || background.revision.length === 0) {
      delete body.dataset.dshCustomBackground
      for (const property of CUSTOM_BACKGROUND_PROPERTIES) body.style.removeProperty(property)
      return
    }
    body.dataset.dshCustomBackground = 'true'
    body.style.setProperty('--dsp-custom-background-image', `url("${customBackgroundUrl(this.desiredSkinId, background.revision)}")`)
    body.style.setProperty('--dsp-custom-background-position', background.position)
    body.style.setProperty('--dsp-custom-background-size', background.fit)
    body.style.setProperty('--dsp-custom-background-opacity', String(background.opacity))
    body.style.setProperty('--dsp-custom-background-blur', `${String(background.blur)}px`)
    body.style.setProperty('--dsp-custom-background-shade', String(background.shade))
  }

  /** Publish one optimistic treatment and serialize durable writes without accepting stale echoes. */
  private async commitCustomBackground(skinId: string, next: CustomBackgroundSettings): Promise<void> {
    this.customBackgroundPreviewActive = false
    const backgrounds = cloneCustomBackgrounds({ ...this.customBackgrounds, [skinId]: next })
    this.customBackgrounds = backgrounds
    if (this.desiredSkinId === skinId) {
      this.customBackground = { ...next }
      this.applyCustomBackground()
      this.publish()
    }
    this.pendingCustomBackgroundWrites += 1
    const write = this.customBackgroundWriteTail.then(async () => {
      await this.settings.set('customBackgrounds', backgrounds)
    })
    this.customBackgroundWriteTail = write.catch(() => {})
    try {
      await write
    } finally {
      this.pendingCustomBackgroundWrites -= 1
      if (this.pendingCustomBackgroundWrites === 0 && !this.customBackgroundPreviewActive) {
        this.adoptSettings()
      }
    }
  }

  /** Build one detached immutable view. */
  private buildSnapshot(): SkinRuntimeSnapshot {
    return Object.freeze({
      revision: this.revision,
      activeSkinId: this.activePack?.id ?? null,
      activePack: this.activePack,
      packs: Object.freeze([...this.packs.values()].sort((left, right) => left.name.localeCompare(right.name))),
      motionEnabled: this.motionEnabled,
      customBackground: Object.freeze({ ...this.customBackground }),
      customBackgroundUrl: this.customBackground.revision.length === 0
        ? null
        : customBackgroundUrl(this.desiredSkinId, this.customBackground.revision),
      persistence: this.persistence,
      error: this.error,
    })
  }

  /** Publish one new snapshot. */
  private publish(): void {
    this.revision += 1
    this.snapshot = this.buildSnapshot()
    for (const listener of this.listeners) listener()
  }

  /** Resolve one detached treatment without borrowing another skin's setting. */
  private resolveCustomBackground(skinId: string): CustomBackgroundSettings {
    return { ...(this.customBackgrounds[skinId] ?? defaultCustomBackground()) }
  }

  /** Release DOM and listener ownership on plugin teardown. */
  private dispose(): void {
    if (this.disposed) return
    this.disposed = true
    this.releaseVisual()
    if (typeof document !== 'undefined') {
      delete document.body.dataset.dshCustomBackground
      for (const property of CUSTOM_BACKGROUND_PROPERTIES) document.body.style.removeProperty(property)
    }
    this.listeners.clear()
  }
}

/** Create the same-origin image URL whose query changes only after accepted bytes change. */
function customBackgroundUrl(skinId: string, revision: string): string {
  return `${customBackgroundRoute(skinId)}?v=${encodeURIComponent(revision)}`
}

/** Create the same-origin mutation route for one validated skin id. */
function customBackgroundRoute(skinId: string): string {
  return `${CUSTOM_BACKGROUND_ROUTE}/${encodeURIComponent(skinId)}`
}

/** Detach the Host settings map and every nested visual treatment. */
function cloneCustomBackgrounds(backgrounds: Record<string, CustomBackgroundSettings>): Record<string, CustomBackgroundSettings> {
  return Object.fromEntries(Object.entries(backgrounds).map(([skinId, background]) => [skinId, { ...background }]))
}

/** Narrow the Host response before it changes durable browser state. */
function parseStoredBackground(value: unknown): { revision: string } {
  if (typeof value !== 'object' || value === null || !(('revision') in value)) {
    throw new Error('背景服务返回了无效结果。')
  }
  const revision = (value as { revision?: unknown }).revision
  if (typeof revision !== 'string' || !/^[a-f0-9]{64}$/.test(revision)) {
    throw new Error('背景服务返回了无效版本标识。')
  }
  return { revision }
}

/** Prefer a concise Host diagnostic while keeping non-JSON failures readable. */
async function readResponseError(response: Response, fallback: string): Promise<string> {
  try {
    const value: unknown = await response.json()
    if (typeof value === 'object' && value !== null && 'error' in value) {
      const error = (value as { error?: unknown }).error
      if (typeof error === 'string' && error.length > 0) return error
    }
  } catch {
    // A non-JSON error body carries no additional structured diagnostic.
  }
  return fallback
}

/** Type-only proof that the Cordis Context merge is available to package clients. */
export type SkinRuntimeContext = Pick<Context, 'skinRuntime'>
