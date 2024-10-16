#!/usr/bin/env zx

import path from 'node:path'
import { $, fs } from 'zx'
import { appConfig } from '../lib/config/app.js'

const dataVolumeDir = appConfig.dataVolumeDir

console.log(dataVolumeDir)

const PRISMA_DB = path.join(dataVolumeDir, 'dev.db')
const ICONS_PATH = path.join(dataVolumeDir, 'icons')

console.log('prismaPath: ', PRISMA_DB)
console.log('iconsPath: ', ICONS_PATH)

if (!(await fs.pathExists(ICONS_PATH))) {
  // create icons dir
  await $`mkdir -p ${ICONS_PATH}`
  console.log('create icons dir done.')
}
if (!(await fs.exists(PRISMA_DB))) {
  await $`npx prisma migrate dev --name apply` // auto trigger seeding
}
await $`npx prisma migrate deploy`
console.log('prisma migrate deploy done!')
