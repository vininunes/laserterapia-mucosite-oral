import { fileURLToPath } from 'node:url'

import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react-swc'
import { viteSingleFile } from 'vite-plugin-singlefile'
import { defineConfig } from 'vitest/config'

export default defineConfig(({ mode }) => {
  // `yarn build:single`: um único index.html com JS, CSS e o worker do Monte
  // Carlo embutidos, para abrir direto como arquivo (celular, pendrive, e-mail).
  const single = mode === 'single'

  return {
    // Caminhos relativos: o build funciona em qualquer subdiretório de hospedagem estática.
    base: './',
    plugins: [react(), tailwindcss(), ...(single ? [viteSingleFile()] : [])],
    resolve: single
      ? {
          alias: [
            {
              find: /^\.\/create-mc-worker$/,
              replacement: fileURLToPath(new URL('./src/scenes/tissue/create-mc-worker.inline.ts', import.meta.url)),
            },
          ],
        }
      : undefined,
    build: single ? { outDir: 'dist-single' } : undefined,
    test: {
      include: ['src/**/*.test.ts'],
      environment: 'node',
    },
  }
})
