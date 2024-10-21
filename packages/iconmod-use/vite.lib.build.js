import { svelte } from '@sveltejs/vite-plugin-svelte'
import { build, createLogger } from 'vite'
import dts from 'vite-plugin-dts'

const buildLogger = createLogger('info', { prefix: '[lib:build]' })

buildLogger.info('start build compoent and config')

const entries = [
  {
    name: 'iconmod',
    entry: 'src/pkg/index.ts',
  },
  {
    name: 'config',
    entry: 'src/pkg/config.ts',
  },
]

entries.forEach(async (entry) => {
  await build({
    configFile: false,
    build: {
      rollupOptions: {
        input: entry.entry,
        output: {
          assetFileNames: `${entry.name}/[name].[ext]`,
          entryFileNames: () => '[name]/[name].[format].js',
        },
      },
    },
    plugins: [
      svelte({
        compilerOptions: {
          customElement: true,
        },
      }),
      dts({
        insertTypesEntry: true,
        include: ['src/pkg/**/*.ts'],
      }),
    ],
  })
})
