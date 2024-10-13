import type { FastifyReply } from 'fastify'
import * as fs from 'node:fs/promises'
import * as path from 'node:path'
import { IconSet } from '@iconify/tools'
import { triggerIconSetsUpdate } from '../../data/icon-sets.js'
import { fileExists } from '../../misc/files.js'

export interface CreateIconSetBody {
  prefix: string
  name: string
}
export async function handleCreateIconSet(body: CreateIconSetBody, res: FastifyReply) {
  const { prefix, name } = body
  const iconset = new IconSet({
    prefix,
    info: {
      name,
      total: 0,
      version: '0.0.1',
      author: {
        name: 'PROJECT',
        url: '/',
      },
      license: { title: 'MIT', spdx: 'MIT' },
      samples: [],
      height: 24,
      displayHeight: 24,
      palette: false,
    },
    icons: {},
  })

  const iconJson = iconset.export(true)
  const iconSetPath = path.join(`icons/${prefix}.json`)
  if (await fileExists(iconSetPath)) {
    res.send({ code: 400, message: `${prefix} iconset existed` })
  }
  await fs.writeFile(iconSetPath, JSON.stringify(iconJson, null, 2))
  // update custom icon
  await triggerIconSetsUpdate(1)
  res.send({ code: 200, data: iconJson })
}
