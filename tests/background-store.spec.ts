import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import {
  BackgroundTooLargeError,
  CustomBackgroundStore,
  UnsupportedBackgroundError,
  detectBackgroundMimeType,
  readBackgroundBody,
} from '../packages/runtime/src/background-store.ts'

const temporaryHomes: string[] = []
const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00])
const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00])

afterEach(async () => {
  await Promise.all(temporaryHomes.splice(0).map(path => rm(path, { recursive: true, force: true })))
})

describe('custom background storage', () => {
  it('accepts allowlisted raster signatures and rejects SVG text', () => {
    expect(detectBackgroundMimeType(png)).toBe('image/png')
    expect(detectBackgroundMimeType(Buffer.from('<svg></svg>'))).toBeUndefined()
  })

  it('drains an oversized stream before rejecting it', async () => {
    let delivered = 0
    async function* source(): AsyncGenerator<Buffer> {
      for (const chunk of [Buffer.alloc(4), Buffer.alloc(4), Buffer.alloc(4)]) {
        delivered += 1
        yield chunk
      }
    }
    await expect(readBackgroundBody(source(), 8)).rejects.toBeInstanceOf(BackgroundTooLargeError)
    expect(delivered).toBe(3)
  })

  it('round-trips, replaces, and removes one private fixed file', async () => {
    const home = await mkdtemp(join(tmpdir(), 'dsh-skin-runtime-'))
    temporaryHomes.push(home)
    const store = new CustomBackgroundStore(home)
    const written = await store.write(png)
    expect(written.mimeType).toBe('image/png')
    expect(written.revision).toMatch(/^[a-f0-9]{64}$/)
    const read = await store.read()
    expect(read.body).toEqual(png)
    const replaced = await store.write(jpeg)
    expect(replaced.mimeType).toBe('image/jpeg')
    expect((await store.read()).body).toEqual(jpeg)
    await store.remove()
    await expect(store.read()).rejects.toMatchObject({ code: 'ENOENT' })
  })

  it('does not write unsupported bytes', async () => {
    const home = await mkdtemp(join(tmpdir(), 'dsh-skin-runtime-'))
    temporaryHomes.push(home)
    const store = new CustomBackgroundStore(home)
    await expect(store.write(Buffer.from('not an image'))).rejects.toBeInstanceOf(UnsupportedBackgroundError)
  })
})
