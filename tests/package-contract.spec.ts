import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const root = resolve(fileURLToPath(new URL('..', import.meta.url)))
const packageDirs = ['runtime', 'skin-void-whisper', 'skin-dream-journey'] as const

function read(relative: string): string {
  return readFileSync(resolve(root, relative), 'utf8')
}

describe('installable package contracts', () => {
  it('declares every package as a Web bundle with a Client entry', () => {
    for (const dir of packageDirs) {
      const manifest = JSON.parse(read(`packages/${dir}/package.json`)) as {
        exports?: Record<string, unknown>
        dsh?: { bundle?: { patch?: string }; client?: { platform?: string } }
      }
      expect(manifest.exports?.['./client']).toBeDefined()
      expect(manifest.dsh?.bundle?.patch).toBe('./cordis.patch.yml')
      expect(manifest.dsh?.client?.platform).toBe('web')
    }
  })

  it('uses Cordis service names rather than plugin entry ids for Host ordering', () => {
    const runtimePatch = read('packages/runtime/cordis.patch.yml')
    expect(runtimePatch).toContain('inject: [settings, webServer]')
    for (const dir of ['skin-void-whisper', 'skin-dream-journey']) {
      const patch = read(`packages/${dir}/cordis.patch.yml`)
      expect(patch).toContain('inject: [skinAssets]')
      expect(patch).not.toContain('inject: [skin-runtime]')
    }
  })

  it('ships the original SVG without executable content', () => {
    const svg = read('packages/skin-void-whisper/assets/background.svg')
    expect(svg).toContain('<svg')
    expect(svg).not.toMatch(/<script\b/i)
  })

  it('ships the original dream background as a real PNG', () => {
    const png = readFileSync(resolve(root, 'packages/skin-dream-journey/assets/background.png'))
    expect(png.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a')
  })

  it('retains published archives and refuses to overwrite an existing version', () => {
    const packScript = read('scripts/pack-all.mjs')
    expect(packScript).not.toContain('rmSync(artifacts')
    expect(packScript).toContain('Refusing to overwrite existing package archive')
  })
})
