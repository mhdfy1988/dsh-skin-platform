import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['lib/types/index.js'], outDir: 'lib', format: ['esm'], platform: 'node', target: 'es2024',
  fixedExtension: false, dts: false, clean: false,
  deps: { neverBundle: (specifier: string) => specifier.startsWith('@deepseek-ai/') || specifier === 'dsh-skin-runtime' },
})
