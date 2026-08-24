import { describe, expect, it, vi } from 'vitest'
import { SkinRuntime } from '../packages/runtime/src/client/runtime.ts'
import { SKIN_API_VERSION, type SkinPack, type SkinSettings } from '../packages/runtime/src/types.ts'

const pack: SkinPack = {
  apiVersion: SKIN_API_VERSION,
  id: 'void-whisper',
  name: '虚空低语',
  description: '测试皮肤',
  version: '0.1.0',
  dshRange: '0.1.1-rc.2',
  colorScheme: 'fixed-dark',
  previewUrl: '/skin-assets/void-whisper/background.svg',
  tokens: {},
  appearance: {
    backgroundUrl: '/skin-assets/void-whisper/background.svg',
    backgroundPosition: 'center center',
    accent: '#9877f5',
    glow: '#754cff',
    fontFamily: 'serif',
  },
}

function createRuntime(): { runtime: SkinRuntime; set: ReturnType<typeof vi.fn> } {
  const value: SkinSettings = {
    activeSkinId: pack.id,
    motionEnabled: true,
    customBackgrounds: {},
  }
  const set = vi.fn(async () => {})
  const settings = {
    getSnapshot: () => ({
      status: 'ready' as const,
      value,
      base: value,
      user: value,
      revision: 1,
      writable: true,
      mode: 'host' as const,
    }),
    subscribe: () => () => {},
    set,
    unset: vi.fn(async () => {}),
  }
  const context = { effect: (install: () => void | (() => void)) => { install() } }
  const theme = { overrideTokens: () => () => {} }
  return { runtime: new SkinRuntime(context as never, settings as never, theme as never), set }
}

describe('skin registration lifecycle', () => {
  it('preserves the durable selection while a selected package is replaced', () => {
    const { runtime, set } = createRuntime()
    const unregister = runtime.register(pack)

    expect(runtime.getSnapshot().activeSkinId).toBe(pack.id)
    unregister()

    expect(runtime.getSnapshot().activeSkinId).toBeNull()
    expect(runtime.getSnapshot().error).toContain('尚未安装')
    expect(set).not.toHaveBeenCalled()

    runtime.register(pack)
    expect(runtime.getSnapshot().activeSkinId).toBe(pack.id)
    expect(runtime.getSnapshot().error).toBeNull()
  })
})
