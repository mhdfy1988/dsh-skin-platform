/** Host asset registration for the Void Whisper skin. */

import { fileURLToPath } from 'node:url'
import type { Context } from '@deepseek-ai/cordis'
import type {} from 'dsh-skin-runtime'

export const inject = ['skinAssets']

/** Register this package's explicit SVG allowlist. */
export async function apply(ctx: Context): Promise<void> {
  const dispose = await ctx.skinAssets.register({
    id: 'void-whisper',
    assets: [{
      path: 'background.svg',
      filePath: fileURLToPath(new URL('../assets/background.svg', import.meta.url)),
      contentType: 'image/svg+xml',
    }],
  })
  ctx.effect(() => dispose, 'skin-void-whisper: static assets')
}
