/// <reference types="vitest" />

import type { UserConfig } from 'vite'
import path, { resolve } from 'node:path'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'
import { viteStaticCopy } from 'vite-plugin-static-copy'

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
        hydratable: true,
      },
    }),
  ],
}

export default defineConfig(({ mode }) => {
  if (mode === 'lib') {
    config.build = {
      lib: {
        entry: resolve(__dirname, 'pkg/index.ts'),
        name: 'Iconmod',
        fileName: 'iconmod',
        formats: ['iife'],
      },
    }
    config.plugins?.push(dts({
      insertTypesEntry: true,
      include: ['pkg/**/*.ts'],
    }), viteStaticCopy({
      targets: [
        {
          src: 'src/template',
          dest: '.',
        },
      ],
    }))
  }
  return config
})
