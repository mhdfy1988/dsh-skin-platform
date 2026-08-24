/** Host asset registration for the Dream Journey skin. */

import { fileURLToPath } from 'node:url'
import type { Context } from '@deepseek-ai/cordis'
import type {} from 'dsh-skin-runtime'

export const inject = ['skinAssets']

/** Register this package's explicit PNG allowlist. */
export async function apply(ctx: Context): Promise<void> {
  const dispose = await ctx.skinAssets.register({
    id: 'dream-journey',
    assets: [{
      path: 'background.png',
      filePath: fileURLToPath(new URL('../assets/background.png', import.meta.url)),
      contentType: 'image/png',
    }],
  })
  ctx.effect(() => dispose, 'skin-dream-journey: static assets')
}
