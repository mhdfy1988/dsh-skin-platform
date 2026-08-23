import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'

const require = createRequire(import.meta.url)

/** Resolve and run one package-provided executable in the caller's directory. */
export function runPackageBin(packageName, args, cwd = process.cwd()) {
  const manifestPath = require.resolve(`${packageName}/package.json`)
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))
  const declared = typeof manifest.bin === 'string'
    ? manifest.bin
    : manifest.bin?.[packageName] ?? Object.values(manifest.bin ?? {})[0]
  if (typeof declared !== 'string') throw new Error(`${packageName} declares no executable`)
  const executable = resolve(dirname(manifestPath), declared)
  const result = spawnSync(process.execPath, [executable, ...args], { cwd, stdio: 'inherit' })
  if (result.error !== undefined) throw result.error
  if (result.status !== 0) process.exit(result.status ?? 1)
}

/** Absolute path of this workspace root. */
export const workspaceRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
