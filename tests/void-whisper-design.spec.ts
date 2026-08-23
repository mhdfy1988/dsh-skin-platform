import { describe, expect, it } from 'vitest'
import { pack } from '../packages/skin-void-whisper/src/client/index.ts'

describe('Void Whisper visual language', () => {
  it('keeps the shell dark while reserving cool violet for borders and selection', () => {
    expect(pack.colorScheme).toBe('fixed-dark')
    expect(pack.appearance.accent).toBe('#9b7cff')
    expect(pack.appearance.glow).toBe('#754cff')
    expect(pack.tokens['--dsw-alias-brand-primary']?.dark).toBe('#9877f5')
    expect(pack.tokens['--dsw-alias-border-l3']?.dark).toBe('rgba(177,151,255,.42)')
    expect(pack.tokens['--dsw-alias-bg-overlay']?.dark).toBe('rgba(3,6,19,.98)')
  })

  it('uses muted text beneath the primary hierarchy instead of white secondary copy', () => {
    expect(pack.tokens['--dsw-alias-label-primary']?.dark).toBe('#eef0f8')
    expect(pack.tokens['--dsw-alias-label-secondary']?.dark).toBe('#bec3d3')
    expect(pack.tokens['--dsw-alias-label-tertiary']?.dark).toBe('#959caf')
    expect(pack.tokens['--dsw-alias-button-info-fill']?.dark).toBe('#7957dc')
  })
})
