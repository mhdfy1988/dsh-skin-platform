import { mkdirSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'
import { workspaceRoot } from './run-bin.mjs'

const artifacts = join(workspaceRoot, 'artifacts')
const pnpmScript = process.env.npm_execpath
if (pnpmScript === undefined) throw new Error('pack:all must run through pnpm so npm_execpath identifies the active pnpm runtime')
rmSync(artifacts, { recursive: true, force: true })
mkdirSync(artifacts, { recursive: true })
for (const name of ['runtime', 'skin-void-whisper']) {
  const cwd = join(workspaceRoot, 'packages', name)
  const result = spawnSync(process.execPath, [pnpmScript, 'pack', '--pack-destination', artifacts], {
    cwd,
    stdio: 'inherit',
  })
  if (result.error !== undefined) throw result.error
  if (result.status !== 0) process.exit(result.status ?? 1)
}
