import nodeResolve from '@rollup/plugin-node-resolve'
import svelte from 'rollup-plugin-svelte'
import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig({
  entries: [
    'src/pkg/index',
    'src/pkg/config',
  ],
  outDir: 'dist',
  declaration: true,
  clean: true,
  failOnWarn: false,
  hooks: {
    'rollup:options': function (ctx, opts) {
      if (Array.isArray(opts.plugins)) {
        opts.plugins.push(
          svelte({
            compilerOptions: {
              customElement: true,
            },
          }),
          nodeResolve({
            browser: true,
            extensions: ['.svelte', '.ts'],
          }),
        )
      }
    },
  },
})
