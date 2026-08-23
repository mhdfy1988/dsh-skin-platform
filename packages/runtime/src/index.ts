/** Host-side asset and durable-settings service for independently installed skin packages. */

import { readFile, stat } from 'node:fs/promises'
import { isAbsolute } from 'node:path'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { Service } from '@deepseek-ai/cordis'
import type { Context } from '@deepseek-ai/cordis'
import type {} from '@deepseek-ai/dsh-host-webserver'
import { settingsNamespace } from '@deepseek-ai/dsh-settings'
import type {} from '@deepseek-ai/dsh-settings'
import z from '@deepseek-ai/schemastery'
import {
  CUSTOM_BACKGROUND_ROUTE,
  DEFAULT_SKIN_ID,
  SKIN_SETTINGS_NAMESPACE,
  defaultCustomBackground,
  type SkinAssetDefinition,
  type SkinAssetPack,
  type SkinSettings,
} from './types.ts'
import {
  BackgroundTooLargeError,
  CustomBackgroundStore,
  UnsupportedBackgroundError,
  readBackgroundBody,
} from './background-store.ts'

export type * from './types.ts'

/** Stable Cordis plugin name. */
export const name = 'skin-runtime'

/** Host services required by the runtime. */
export const inject = ['settings', 'webServer']

/** Shared browser route for every registered skin asset. */
export const SKIN_ASSET_ROUTE = '/skin-assets'

/** Host-side storage controls for the local user background. */
export interface Config {
  /** Harness home receiving `skin-runtime/user-background`; defaults to `$DSH_HOME` or `~/.dsh`. */
  dshHome?: string
  /** Maximum accepted upload size in bytes; defaults to 25 MiB. */
  maxBackgroundBytes?: number
}

const SKIN_ID_PATTERN = /^[a-z][a-z0-9-]*$/
const CONTENT_TYPE_PATTERN = /^[a-z0-9.+-]+\/[a-z0-9.+-]+$/i
const namespace = settingsNamespace(SKIN_SETTINGS_NAMESPACE)

const SkinSettingsSchema: z<SkinSettings> = z.object({
  activeSkinId: z.string().default(DEFAULT_SKIN_ID),
  motionEnabled: z.boolean().default(true),
  customBackground: z.object({
    enabled: z.boolean().required(),
    revision: z.string().required(),
    fit: z.union([z.const('cover'), z.const('contain')]).required(),
    position: z.union([z.const('center'), z.const('top'), z.const('bottom'), z.const('left'), z.const('right')]).required(),
    opacity: z.number().min(0.15).max(1).required(),
    blur: z.number().min(0).max(24).required(),
    shade: z.number().min(0).max(0.85).required(),
  }).default(defaultCustomBackground()),
})

interface RegisteredAsset {
  filePath: string
  contentType: string
}

declare module '@deepseek-ai/cordis' {
  interface Context {
    /** Static assets contributed by independently installed skin packages. */
    skinAssets: SkinAssetsService
  }
}

/** Reject paths that could escape or alias the explicit asset allowlist. */
function validateAssetPath(path: string): void {
  if (path.length === 0 || path.startsWith('/') || path.includes('\\')) {
    throw new TypeError(`skin asset path ${JSON.stringify(path)} must be relative and use forward slashes`)
  }
  const segments = path.split('/')
  if (segments.some(segment => segment.length === 0 || segment === '.' || segment === '..')) {
    throw new TypeError(`skin asset path ${JSON.stringify(path)} contains an invalid segment`)
  }
}

/** Validate one file registration before it becomes request-visible. */
async function validateAsset(asset: SkinAssetDefinition): Promise<void> {
  validateAssetPath(asset.path)
  if (!isAbsolute(asset.filePath)) {
    throw new TypeError(`skin asset ${JSON.stringify(asset.path)} must resolve to an absolute file path`)
  }
  if (!CONTENT_TYPE_PATTERN.test(asset.contentType)) {
    throw new TypeError(`skin asset ${JSON.stringify(asset.path)} has invalid Content-Type ${JSON.stringify(asset.contentType)}`)
  }
  const info = await stat(asset.filePath)
  if (!info.isFile()) throw new TypeError(`skin asset ${JSON.stringify(asset.path)} is not a file`)
}

/** Shared asset registry and HTTP route for all installed skin packages. */
export class SkinAssetsService extends Service {
  static inject = inject

  static Config: z<Config> = z.object({
    dshHome: z.string(),
    maxBackgroundBytes: z.number().min(1).default(25 * 1024 * 1024),
  })

  private readonly packs = new Map<string, ReadonlyMap<string, RegisteredAsset>>()
  private readonly context: Context
  private readonly backgroundStore: CustomBackgroundStore
  private readonly maxBackgroundBytes: number

  /** Register the settings namespace and the single managed asset route. */
  constructor(ctx: Context, ctxConfig: Config = {}) {
    const maxBackgroundBytes = ctxConfig.maxBackgroundBytes ?? 25 * 1024 * 1024
    if (!Number.isSafeInteger(maxBackgroundBytes) || maxBackgroundBytes < 1) {
      throw new TypeError('skin-runtime: maxBackgroundBytes must be a positive safe integer')
    }
    super(ctx, 'skinAssets')
    this.context = ctx
    this.backgroundStore = new CustomBackgroundStore(ctxConfig.dshHome)
    this.maxBackgroundBytes = maxBackgroundBytes
    ctx.settings.register(namespace, SkinSettingsSchema, { applies: 'live' })
    ctx.effect(() => ctx.webServer.register({
      kind: 'prefix',
      path: SKIN_ASSET_ROUTE,
      handler: async (req, res) => { await this.serve(req, res) },
    }), 'skin-runtime: static asset route')
  }

  /**
   * Register one skin package's explicit file allowlist.
   * @param pack - stable skin id and absolute asset files.
   * @returns disposer removing exactly this registration.
   */
  async register(pack: SkinAssetPack): Promise<() => void> {
    if (!SKIN_ID_PATTERN.test(pack.id)) {
      throw new TypeError(`skin id ${JSON.stringify(pack.id)} must match ${String(SKIN_ID_PATTERN)}`)
    }
    if (this.packs.has(pack.id)) throw new Error(`skin assets for ${JSON.stringify(pack.id)} are already registered`)
    if (pack.assets.length === 0) throw new TypeError(`skin ${JSON.stringify(pack.id)} declares no assets`)

    const assets = new Map<string, RegisteredAsset>()
    for (const asset of pack.assets) {
      await validateAsset(asset)
      if (assets.has(asset.path)) {
        throw new Error(`skin ${JSON.stringify(pack.id)} declares duplicate asset ${JSON.stringify(asset.path)}`)
      }
      assets.set(asset.path, { filePath: asset.filePath, contentType: asset.contentType })
    }
    this.packs.set(pack.id, assets)
    return () => {
      if (this.packs.get(pack.id) === assets) this.packs.delete(pack.id)
    }
  }

  /** Serve one allowlisted asset without interpreting request paths as filesystem paths. */
  private async serve(req: IncomingMessage, res: ServerResponse): Promise<void> {
    let pathname: string
    try {
      pathname = decodeURIComponent(new URL(req.url ?? '/', 'http://skin-runtime.local').pathname)
    } catch {
      res.writeHead(400)
      res.end('bad request')
      return
    }
    if (pathname === CUSTOM_BACKGROUND_ROUTE) {
      await this.serveCustomBackground(req, res)
      return
    }
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      res.writeHead(405, { Allow: 'GET, HEAD' })
      res.end('method not allowed')
      return
    }
    if (!pathname.startsWith(`${SKIN_ASSET_ROUTE}/`)) {
      res.writeHead(404)
      res.end('not found')
      return
    }
    const relative = pathname.slice(SKIN_ASSET_ROUTE.length + 1)
    const separator = relative.indexOf('/')
    if (separator <= 0) {
      res.writeHead(404)
      res.end('not found')
      return
    }
    const skinId = relative.slice(0, separator)
    const assetPath = relative.slice(separator + 1)
    const asset = this.packs.get(skinId)?.get(assetPath)
    if (asset === undefined) {
      res.writeHead(404)
      res.end('not found')
      return
    }
    try {
      const body = await readFile(asset.filePath)
      res.writeHead(200, {
        'Cache-Control': 'public, max-age=3600',
        'Content-Length': String(body.byteLength),
        'Content-Type': asset.contentType,
        'X-Content-Type-Options': 'nosniff',
      })
      res.end(req.method === 'HEAD' ? undefined : body)
    } catch {
      res.writeHead(404)
      res.end('not found')
    }
  }

  /** Serve, replace, or remove the single private local background. */
  private async serveCustomBackground(req: IncomingMessage, res: ServerResponse): Promise<void> {
    switch (req.method) {
      case 'GET':
      case 'HEAD':
        await this.readCustomBackground(req, res)
        return
      case 'POST':
        await this.writeCustomBackground(req, res)
        return
      case 'DELETE':
        await this.removeCustomBackground(req, res)
        return
      default:
        res.writeHead(405, { Allow: 'GET, HEAD, POST, DELETE' })
        res.end('method not allowed')
    }
  }

  /** Return the current image only to the same-origin page that owns the UI. */
  private async readCustomBackground(req: IncomingMessage, res: ServerResponse): Promise<void> {
    try {
      const stored = await this.backgroundStore.read()
      const etag = `"${stored.revision}"`
      if (req.headers['if-none-match'] === etag) {
        res.writeHead(304, {
          'Cache-Control': 'private, no-cache',
          'Cross-Origin-Resource-Policy': 'same-origin',
          ETag: etag,
        })
        res.end()
        return
      }
      res.writeHead(200, {
        'Cache-Control': 'private, no-cache',
        'Content-Length': String(stored.size),
        'Content-Type': stored.mimeType,
        'Cross-Origin-Resource-Policy': 'same-origin',
        ETag: etag,
        'X-Content-Type-Options': 'nosniff',
      })
      res.end(req.method === 'HEAD' ? undefined : stored.body)
    } catch (error) {
      if (!isENOENT(error) && !(error instanceof UnsupportedBackgroundError)) {
        this.context.logger.warn(error instanceof Error ? error : new Error(String(error)))
      }
      res.writeHead(404)
      res.end('not found')
    }
  }

  /** Accept one validated same-origin raster upload and return its content revision. */
  private async writeCustomBackground(req: IncomingMessage, res: ServerResponse): Promise<void> {
    if (!isSameOriginMutation(req)) {
      req.resume()
      sendJson(res, 403, { error: 'same-origin request required' })
      return
    }
    const declaredLength = parseContentLength(req.headers['content-length'])
    if (declaredLength !== undefined && declaredLength > this.maxBackgroundBytes) {
      req.resume()
      sendJson(res, 413, { error: `background image exceeds ${String(this.maxBackgroundBytes)} bytes` })
      return
    }
    try {
      const body = await readBackgroundBody(req, this.maxBackgroundBytes)
      const stored = await this.backgroundStore.write(body)
      sendJson(res, 201, stored)
    } catch (error) {
      if (error instanceof BackgroundTooLargeError) {
        sendJson(res, 413, { error: error.message })
        return
      }
      if (error instanceof UnsupportedBackgroundError) {
        sendJson(res, 415, { error: error.message })
        return
      }
      this.context.logger.warn(error instanceof Error ? error : new Error(String(error)))
      sendJson(res, 500, { error: 'background image could not be stored' })
    }
  }

  /** Disable storage without touching any skin-package asset. */
  private async removeCustomBackground(req: IncomingMessage, res: ServerResponse): Promise<void> {
    if (!isSameOriginMutation(req)) {
      res.writeHead(403)
      res.end('same-origin request required')
      return
    }
    try {
      await this.backgroundStore.remove()
      res.writeHead(204)
      res.end()
    } catch (error) {
      this.context.logger.warn(error instanceof Error ? error : new Error(String(error)))
      sendJson(res, 500, { error: 'background image could not be removed' })
    }
  }
}

/** Whether a filesystem error reports an absent local image. */
function isENOENT(error: unknown): boolean {
  return (error as NodeJS.ErrnoException | null)?.code === 'ENOENT'
}

/** Parse a trustworthy non-negative Content-Length or ignore a malformed declaration. */
function parseContentLength(value: string | undefined): number | undefined {
  if (value === undefined || !/^\d+$/.test(value)) return undefined
  const parsed = Number(value)
  return Number.isSafeInteger(parsed) ? parsed : undefined
}

/** Reject browser mutations whose Origin does not match the request Host. */
function isSameOriginMutation(req: IncomingMessage): boolean {
  const origin = req.headers.origin
  if (origin === undefined) return true
  const host = req.headers.host
  if (host === undefined) return false
  try {
    const parsed = new URL(origin)
    return (parsed.protocol === 'http:' || parsed.protocol === 'https:') && parsed.host === host
  } catch {
    return false
  }
}

/** Send one non-cacheable JSON API response. */
function sendJson(res: ServerResponse, status: number, value: unknown): void {
  const body = Buffer.from(JSON.stringify(value))
  res.writeHead(status, {
    'Cache-Control': 'no-store',
    'Content-Length': String(body.byteLength),
    'Content-Type': 'application/json; charset=utf-8',
    'X-Content-Type-Options': 'nosniff',
  })
  res.end(body)
}

export default SkinAssetsService
