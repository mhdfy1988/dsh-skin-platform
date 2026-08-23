import { describe, expect, it } from 'vitest'
import { pack as voidWhisper } from '../packages/skin-void-whisper/src/client/index.ts'
import { resolveSkinTokenOverrides } from '../packages/runtime/src/client/runtime.ts'
import { SKIN_RUNTIME_CSS } from '../packages/runtime/src/client/styles.ts'
import { SKIN_API_VERSION } from '../packages/runtime/src/types.ts'

const packs = [voidWhisper]

describe('declarative skin manifests', () => {
  it('use unique ids and runtime-owned asset routes', () => {
    expect(new Set(packs.map(pack => pack.id)).size).toBe(packs.length)
    for (const pack of packs) {
      expect(pack.apiVersion).toBe(SKIN_API_VERSION)
      expect(pack.previewUrl).toMatch(new RegExp(`^/skin-assets/${pack.id}/`))
      expect(pack.appearance.backgroundUrl).toMatch(new RegExp(`^/skin-assets/${pack.id}/`))
    }
  })

  it('supplies a light and dark value for every official token override', () => {
    for (const pack of packs) {
      expect(Object.keys(pack.tokens).length).toBeGreaterThan(0)
      for (const [name, modes] of Object.entries(pack.tokens)) {
        expect(name).toMatch(/^--/)
        expect(modes.light.length).toBeGreaterThan(0)
        expect(modes.dark.length).toBeGreaterThan(0)
      }
    }
  })

  it('keeps fixed-scheme skins stable across official appearance changes', () => {
    for (const pack of packs) {
      expect(pack.colorScheme).toMatch(/^fixed-(light|dark)$/)
      const resolved = resolveSkinTokenOverrides(pack)
      const selectedMode = pack.colorScheme === 'fixed-dark' ? 'dark' : 'light'
      for (const [name, modes] of Object.entries(resolved)) {
        expect(modes.light, name).toBe(modes.dark)
        expect(modes.light, name).toBe(pack.tokens[name]?.[selectedMode])
      }
    }
  })

  it('defines fixed surfaces used by settings, trajectory, and user messages', () => {
    for (const pack of packs) {
      expect(pack.tokens['--dsw-alias-bg-module-platform']).toBeDefined()
      expect(pack.tokens['--dsw-specific-bubble']).toBeDefined()
      expect(pack.tokens['--dsw-alias-markdown-code-block']).toBeDefined()
      expect(pack.tokens['--dsw-alias-markdown-code-block-banner']).toBeDefined()
    }
  })

  it('styles the build badge through a stable official slot marker', () => {
    expect(SKIN_RUNTIME_CSS).toContain('[data-slot="sidebar.brand.name"]')
    expect(SKIN_RUNTIME_CSS).not.toMatch(/_[A-Za-z0-9-]*buildRevision/)
  })

  it('keeps the void whisper background free of a decorative overlay badge', () => {
    expect(voidWhisper.overlay).toBeUndefined()
  })
})
