import path from 'node:path'
import { fileURLToPath } from 'node:url'
import fs from 'fs-extra'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const out = path.resolve(__dirname, '../public')

async function copyLibs() {
  const modules = path.resolve(__dirname, '../node_modules')

  await fs.copy(
    path.join(modules, 'svg-packer/dist/index.browser.js'),
    path.join(out, 'lib/svg-packer.js'),
  )

  await fs.copy(
    path.join(modules, 'jszip/dist/jszip.min.js'),
    path.join(out, 'lib/jszip.min.js'),
  )
}

async function prepare() {
  await copyLibs()
}

prepare()
