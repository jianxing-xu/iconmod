/// <reference types="vitest" />

import type { UserConfig } from 'vite'
import path, { resolve } from 'node:path'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'

const config: UserConfig = {
  resolve: {
    alias: {
      '~/': `${path.resolve(__dirname, 'src')}/`,
    },
  },
  plugins: [
    svelte({
      compilerOptions: {
        customElement: true,
      },
    }),
  ],
}

export default defineConfig(({ mode }) => {
  if (mode === 'lib') {
    config.build = {
      lib: {
        entry: resolve(__dirname, 'src/lib/index.ts'),
        name: 'Iconmod',
        fileName: 'iconmod',
        formats: ['es'],
      },
    }
    config.plugins?.push(dts({
      insertTypesEntry: true,
      include: ['src/lib/**/*.ts'],
    }))
  }
  return config
})
