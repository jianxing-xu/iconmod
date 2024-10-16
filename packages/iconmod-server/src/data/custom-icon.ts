import type { IconifyJSON } from '@iconify/types'
import { readFile, writeFile } from 'node:fs/promises'
import { IconSet } from '@iconify/tools'
import { appConfig } from '../config/app.js'

export async function loadIconSet(prefix: string) {
  const jsonStr = await readFile(`${appConfig.customIconDir}/${prefix}.json`, 'utf-8')
  return new IconSet(JSON.parse(jsonStr) as IconifyJSON)
}

export async function existProject(prefix: string) {
  const path = `${appConfig.customIconDir}/${prefix}.json`
  try {
    await readFile(path)
    return true
  }
  catch (e) {
    return false
  }
}
export async function writeIconSet(prefix: string, jsonStr: string) {
  await writeFile(`${appConfig.customIconDir}/${prefix}.json`, jsonStr)
}
