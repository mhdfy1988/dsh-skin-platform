import { existsSync, mkdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'
import { workspaceRoot } from './run-bin.mjs'

const artifacts = join(workspaceRoot, 'artifacts')
const pnpmScript = process.env.npm_execpath
if (pnpmScript === undefined) throw new Error('pack:all must run through pnpm so npm_execpath identifies the active pnpm runtime')
mkdirSync(artifacts, { recursive: true })
const packageDirs = ['runtime', 'skin-void-whisper', 'skin-dream-journey']
for (const name of packageDirs) {
  const manifest = JSON.parse(readFileSync(join(workspaceRoot, 'packages', name, 'package.json'), 'utf8'))
  const archive = join(artifacts, `${manifest.name}-${manifest.version}.tgz`)
  if (existsSync(archive)) {
    throw new Error(`Refusing to overwrite existing package archive: ${archive}`)
  }
}
for (const name of packageDirs) {
  const cwd = join(workspaceRoot, 'packages', name)
  const result = spawnSync(process.execPath, [pnpmScript, 'pack', '--pack-destination', artifacts], {
    cwd,
    stdio: 'inherit',
  })
  if (result.error !== undefined) throw result.error
  if (result.status !== 0) process.exit(result.status ?? 1)
}
