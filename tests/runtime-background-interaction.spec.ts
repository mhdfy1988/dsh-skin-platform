import { describe, expect, it, vi } from 'vitest'
import { SkinRuntime } from '../packages/runtime/src/client/runtime.ts'
import {
  DEFAULT_SKIN_ID,
  defaultCustomBackground,
  type CustomBackgroundSettings,
  type SkinSettings,
} from '../packages/runtime/src/types.ts'

interface PendingWrite {
  next: CustomBackgroundSettings
  resolve: () => void
}

function createHarness(): {
  runtime: SkinRuntime
  pending: PendingWrite[]
  publishHost: (background: CustomBackgroundSettings) => void
  set: ReturnType<typeof vi.fn>
} {
  let value: SkinSettings = {
    activeSkinId: DEFAULT_SKIN_ID,
    motionEnabled: true,
    customBackground: defaultCustomBackground(),
  }
  const listeners = new Set<() => void>()
  const pending: PendingWrite[] = []
  const set = vi.fn((field: string, next: unknown): Promise<void> => {
    if (field !== 'customBackground') throw new Error(`unexpected field ${field}`)
    return new Promise(resolve => {
      pending.push({ next: next as CustomBackgroundSettings, resolve })
    })
  })
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
    subscribe: (listener: () => void) => {
      listeners.add(listener)
      return () => { listeners.delete(listener) }
    },
    set,
    unset: vi.fn(async () => {}),
  }
  const context = {
    effect: (install: () => void | (() => void)) => { install() },
  }
  const theme = { overrideTokens: () => () => {} }
  const runtime = new SkinRuntime(context as never, settings as never, theme as never)
  return {
    runtime,
    pending,
    set,
    publishHost: background => {
      value = { ...value, customBackground: { ...background } }
      for (const listener of listeners) listener()
    },
  }
}

describe('background visual interaction', () => {
  it('keeps drag previews local and ignores stale Host echoes until the final value settles', async () => {
    const harness = createHarness()
    harness.runtime.previewCustomBackground({ shade: 0.61 })

    expect(harness.runtime.getSnapshot().customBackground.shade).toBe(0.61)
    expect(harness.set).not.toHaveBeenCalled()

    const persisted = harness.runtime.updateCustomBackground({ shade: 0.61 })
    await Promise.resolve()
    expect(harness.pending).toHaveLength(1)

    harness.publishHost({ ...defaultCustomBackground(), shade: 0.28 })
    expect(harness.runtime.getSnapshot().customBackground.shade).toBe(0.61)

    const write = harness.pending.shift()
    if (write === undefined) throw new Error('missing queued background write')
    harness.publishHost(write.next)
    write.resolve()
    await persisted

    expect(harness.runtime.getSnapshot().customBackground.shade).toBe(0.61)
  })
})
