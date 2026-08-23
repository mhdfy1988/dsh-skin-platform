import { defineConfig } from 'tsdown'

/** Bundle the Host service while leaving Harness services shared. */
export default defineConfig({
  entry: ['lib/types/index.js'],
  outDir: 'lib',
  format: ['esm'],
  platform: 'node',
  target: 'es2024',
  fixedExtension: false,
  dts: false,
  clean: false,
  deps: {
    neverBundle: (specifier: string) => specifier.startsWith('@deepseek-ai/'),
  },
})
