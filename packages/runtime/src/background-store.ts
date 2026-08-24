/** Private local storage and validation for the user-selected background image. */

import { createHash, randomBytes } from 'node:crypto'
import { mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { resolveDshHome } from '@deepseek-ai/dsh-home-paths'

const BACKGROUND_DIRECTORY = 'skin-runtime'
const BACKGROUND_FILENAME = 'user-background'
const SKIN_ID_PATTERN = /^[a-z][a-z0-9-]*$/

/** Supported raster formats after byte-signature validation. */
export const SUPPORTED_BACKGROUND_MIME_TYPES = [
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
  'image/avif',
] as const

/** Result returned to the browser after one accepted upload. */
export interface StoredBackground {
  /** Validated media type derived from file bytes. */
  mimeType: typeof SUPPORTED_BACKGROUND_MIME_TYPES[number]
  /** File byte length. */
  size: number
  /** Content revision used to refresh the CSS image URL. */
  revision: string
}

/** A complete stored image ready for an HTTP response. */
export interface StoredBackgroundBody extends StoredBackground {
  /** Validated file bytes. */
  body: Buffer
}

/** Upload body exceeded the configured local limit. */
export class BackgroundTooLargeError extends Error {
  constructor(readonly maxBytes: number) {
    super(`background image exceeds the ${String(maxBytes)} byte limit`)
    this.name = 'BackgroundTooLargeError'
  }
}

/** Bytes do not identify one of the supported raster formats. */
export class UnsupportedBackgroundError extends Error {
  constructor() {
    super('background image must be PNG, JPEG, WebP, GIF, or AVIF')
    this.name = 'UnsupportedBackgroundError'
  }
}

/** Read an HTTP-style byte stream without allowing an unbounded allocation. */
export async function readBackgroundBody(
  source: AsyncIterable<Uint8Array>,
  maxBytes: number,
): Promise<Buffer> {
  const chunks: Buffer[] = []
  let total = 0
  let tooLarge = false
  for await (const chunk of source) {
    total += chunk.byteLength
    if (total > maxBytes) {
      tooLarge = true
      continue
    }
    chunks.push(Buffer.from(chunk))
  }
  if (tooLarge) throw new BackgroundTooLargeError(maxBytes)
  return Buffer.concat(chunks, total)
}

/** Identify an allowed raster format from its file signature, not its extension or request header. */
export function detectBackgroundMimeType(bytes: Uint8Array): StoredBackground['mimeType'] | undefined {
  const body = Buffer.from(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  if (body.length >= 8 && body.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
    return 'image/png'
  }
  if (body.length >= 3 && body[0] === 0xff && body[1] === 0xd8 && body[2] === 0xff) return 'image/jpeg'
  if (body.length >= 12 && body.toString('ascii', 0, 4) === 'RIFF' && body.toString('ascii', 8, 12) === 'WEBP') {
    return 'image/webp'
  }
  const gif = body.toString('ascii', 0, 6)
  if (gif === 'GIF87a' || gif === 'GIF89a') return 'image/gif'
  if (body.length >= 12 && body.toString('ascii', 4, 8) === 'ftyp') {
    const brands = body.toString('ascii', 8, Math.min(body.length, 40))
    if (brands.includes('avif') || brands.includes('avis')) return 'image/avif'
  }
  return undefined
}

/** Private skin-scoped files under the active Harness home. */
export class CustomBackgroundStore {
  private readonly directory: string

  /** Resolve the profile-local storage directory once at plugin activation. */
  constructor(dshHome?: string) {
    if (dshHome !== undefined && dshHome.trim().length === 0) {
      throw new TypeError('skin-runtime: dshHome must not be blank')
    }
    this.directory = join(resolveDshHome(dshHome), BACKGROUND_DIRECTORY)
  }

  /** Validate and atomically replace one skin's stored background. */
  async write(skinId: string, body: Buffer): Promise<StoredBackground> {
    const mimeType = detectBackgroundMimeType(body)
    if (mimeType === undefined) throw new UnsupportedBackgroundError()
    const filename = this.resolveFilename(skinId)
    await mkdir(dirname(filename), {
      recursive: true,
      mode: 0o700,
    })
    const temporary = `${filename}.${randomBytes(6).toString('hex')}.tmp`
    try {
      await writeFile(temporary, body, { flag: 'wx', mode: 0o600 })
      await rename(temporary, filename)
    } catch (error) {
      await rm(temporary, { force: true })
      throw error
    }
    return describe(body, mimeType)
  }

  /** Read and revalidate one skin's stored image before serving it. */
  async read(skinId: string): Promise<StoredBackgroundBody> {
    const body = await readFile(this.resolveFilename(skinId))
    const mimeType = detectBackgroundMimeType(body)
    if (mimeType === undefined) throw new UnsupportedBackgroundError()
    return { body, ...describe(body, mimeType) }
  }

  /** Remove exactly one skin's runtime-owned background file. */
  async remove(skinId: string): Promise<void> {
    await rm(this.resolveFilename(skinId), { force: true })
  }

  /** Resolve only validated skin ids beneath the private runtime directory. */
  private resolveFilename(skinId: string): string {
    if (!SKIN_ID_PATTERN.test(skinId)) {
      throw new TypeError(`skin id ${JSON.stringify(skinId)} must match ${String(SKIN_ID_PATTERN)}`)
    }
    return join(this.directory, skinId, BACKGROUND_FILENAME)
  }
}

/** Build stable response metadata for validated bytes. */
function describe(body: Buffer, mimeType: StoredBackground['mimeType']): StoredBackground {
  return {
    mimeType,
    size: body.byteLength,
    revision: createHash('sha256').update(body).digest('hex'),
  }
}
