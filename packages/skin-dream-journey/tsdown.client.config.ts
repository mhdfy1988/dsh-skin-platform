import { readFileSync } from 'node:fs'
import { defineConfig } from 'tsdown'

const manifest = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')) as { name: string }

export default defineConfig({
  entry: { client: 'lib/types/client/index.js' }, outDir: 'lib', format: 'cjs', platform: 'browser', target: 'es2024',
  fixedExtension: false, dts: false, sourcemap: true, clean: false,
  deps: { alwaysBundle: () => true },
  outputOptions: {
    entryFileNames: 'client.js',
    banner: `window.__ModuleLoader__.load({ id: ${JSON.stringify(manifest.name)}, factory: (require) => {`,
    footer: 'return module.exports; } });',
    intro: 'var module = { exports: {} }; var exports = module.exports;',
  },
})
