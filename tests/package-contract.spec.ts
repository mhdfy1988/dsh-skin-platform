import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const root = resolve(fileURLToPath(new URL('..', import.meta.url)))
const packageDirs = ['runtime', 'skin-void-whisper'] as const

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
    for (const dir of ['skin-void-whisper']) {
      const patch = read(`packages/${dir}/cordis.patch.yml`)
      expect(patch).toContain('inject: [skinAssets]')
      expect(patch).not.toContain('inject: [skin-runtime]')
    }
  })

  it('ships original SVG assets without executable content', () => {
    for (const dir of ['skin-void-whisper']) {
      const svg = read(`packages/${dir}/assets/background.svg`)
      expect(svg).toContain('<svg')
      expect(svg).not.toMatch(/<script\b/i)
    }
  })
})
