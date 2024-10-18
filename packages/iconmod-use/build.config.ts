import resolve from '@rollup/plugin-node-resolve'
import svelte from 'rollup-plugin-svelte'

import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig({
  entries: ['src/index'],
  declaration: true,
  clean: true,
  hooks: {
    'rollup:options': function (_, options) {
      if (Array.isArray(options.plugins)) {
        options.plugins.push(
          svelte({
            emitCss: false,
            compilerOptions: {
              customElement: true,
            },
          }),
          resolve({
            browser: true,
            exportConditions: ['svelte'],
            extensions: ['.svelte'],
          }),
        )
      }
    },
  },
  rollup: { emitCJS: true, output: { format: 'iife' } },
  failOnWarn: false,
})
