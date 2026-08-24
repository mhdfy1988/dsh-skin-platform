import { describe, expect, it } from 'vitest'
import { pack } from '../packages/skin-dream-journey/src/client/index.ts'

function relativeLuminance(hex: string): number {
  const channels = hex.match(/[\da-f]{2}/gi)?.map((value) => Number.parseInt(value, 16) / 255)
  if (!channels || channels.length !== 3) throw new Error(`Expected a six-digit hex color, received ${hex}`)
  const [red, green, blue] = channels.map((value) =>
    value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4,
  )
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue
}

function contrastRatio(foreground: string, background: string): number {
  const lighter = Math.max(relativeLuminance(foreground), relativeLuminance(background))
  const darker = Math.min(relativeLuminance(foreground), relativeLuminance(background))
  return (lighter + 0.05) / (darker + 0.05)
}

function lightToken(name: keyof typeof pack.tokens): string {
  const value = pack.tokens[name]?.light
  if (!value) throw new Error(`Missing light token ${name}`)
  return value
}

describe('Dream Journey visual language', () => {
  it('uses a fixed porcelain-light shell with jade and warm-gold accents', () => {
    expect(pack.colorScheme).toBe('fixed-light')
    expect(pack.appearance.accent).toBe('#2c8f94')
    expect(pack.appearance.glow).toBe('#e6809b')
    expect(pack.tokens['--dsw-alias-brand-primary']?.light).toBe('#24777b')
    expect(pack.tokens['--dsw-alias-border-l4']?.light).toBe('rgba(197,151,72,.58)')
    expect(pack.tokens['--dsw-alias-bg-overlay']?.light).toBe('rgba(255,253,249,.99)')
  })

  it('keeps ink text readable across porcelain panels and code blocks', () => {
    expect(pack.tokens['--dsw-alias-label-primary']?.light).toBe('#23484b')
    expect(pack.tokens['--dsw-alias-label-secondary']?.light).toBe('#4e696c')
    expect(pack.tokens['--dsw-alias-markdown-code-block']?.light).toBe('rgba(250,255,252,.97)')
    expect(pack.tokens['--dsw-specific-input-major']?.light).toBe('rgba(255,255,252,.97)')

    const readableOnPorcelain = [
      '--dsw-alias-brand-primary',
      '--dsw-alias-brand-text',
      '--dsw-alias-label-primary',
      '--dsw-alias-label-secondary',
      '--dsw-alias-label-tertiary',
      '--dsw-alias-label-caption',
      '--dsw-alias-state-business-primary',
      '--dsw-alias-state-error-primary',
      '--dsw-alias-state-success-primary',
      '--dsw-alias-state-warn-label',
    ] as const
    for (const token of readableOnPorcelain) {
      expect(contrastRatio(lightToken(token), '#ffffff')).toBeGreaterThanOrEqual(4.5)
    }

    const foreground = lightToken('--dsw-alias-label-primary-foreground')
    const readableFilledControls = [
      '--dsw-alias-button-primary-fill',
      '--dsw-alias-button-primary-hover',
      '--dsw-alias-button-info-fill',
      '--dsw-alias-button-info-hover',
    ] as const
    for (const token of readableFilledControls) {
      expect(contrastRatio(foreground, lightToken(token))).toBeGreaterThanOrEqual(4.5)
    }
  })

  it('uses an original PNG background and a screen-readable Chinese font stack', () => {
    expect(pack.previewUrl).toBe('/skin-assets/dream-journey/background.png')
    expect(pack.appearance.backgroundUrl).toBe(pack.previewUrl)
    expect(pack.appearance.fontFamily).toContain('LXGW WenKai Screen')
    expect(pack.appearance.fontFamily).toContain('Microsoft YaHei UI')
    expect(pack.appearance.fontFamily.split(',').map((font) => font.trim())).not.toContain('serif')
  })
})
