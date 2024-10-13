import { resolve } from 'node:path'
import Vue from '@vitejs/plugin-vue'
import dayjs from 'dayjs'
import UnoCSS from 'unocss/vite'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { defineConfig } from 'vite'
import Pages from 'vite-plugin-pages'

export default defineConfig(({ mode }) => {
  return {
    server: {
      proxy: {
        '^/api': {
          target: 'http://localhost:3131/',
          rewrite(path) {
            return path.replace(/^\/api/, '')
          },
        },
      },
    },
    plugins: [
      Vue({
        customElement: [
          'iconify-icon',
        ],
        template: {
          compilerOptions: {
            isCustomElement: tag => tag === 'iconify-icon',
          },
        },
      }),
      Pages({
        importMode: 'sync',
      }),
      Components({
        dts: 'src/components.d.ts',
      }),
      AutoImport({
        imports: [
          'vue',
          'vue-router',
          '@vueuse/core',
        ],
        dts: 'src/auto-imports.d.ts',
      }),
      UnoCSS(),
    ],
    define: {
      __BUILD_TIME__: JSON.stringify(dayjs().format('YYYY/MM/DD HH:mm')),
    },
    resolve: {
      alias: {
        'iconify-icon': resolve(__dirname, 'node_modules/iconify-icon/dist/iconify-icon.mjs'),
      },
    },
    base: mode === 'prod' ? '/iconmod' : '/',
  }
})
