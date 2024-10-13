import antfu from '@antfu/eslint-config'

export default antfu(
  {
    ignores: [
      'node_modules',
      '**/node_modules',
      '**/src/assets/collections.json',
      '**/public/collections',
      '**/public/lib',
      '**/release',
      '**/collections-info.json',
      '**/collections-meta.json',
    ],
    formatters: true,
    vue: true,
    typescript: true,
    rules: {
      'no-console': 'off',
      'node/prefer-global/process': 'off',
      'no-unused-vars': 'warn',
      'unused-imports/no-unused-vars': 'warn',
      'antfu/no-top-level-await': 'off',
    },
  },
)
