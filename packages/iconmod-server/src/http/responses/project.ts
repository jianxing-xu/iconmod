import type { IconifyIcon, IconifyJSON } from '@iconify/types'
import type { User } from '@prisma/client'
import type { FastifyReply, FastifyRequest } from 'fastify'
import type { APIv2CollectionResponse } from '../../types/server/v2.js'
import * as fs from 'node:fs/promises'
import * as path from 'node:path'
import { IconSet } from '@iconify/tools'
import { convertParsedSVG, parseSVGContent } from '@iconify/utils'
import z from 'zod'
import { writeIconSet } from '../../data/custom-icon.js'
import { triggerIconSetsUpdate } from '../../data/icon-sets.js'
import { prisma } from '../../data/prisma.js'
import { fileExists } from '../../misc/files.js'
import { packSVGSprite } from '../../utils.js'
import { createAPIv2CollectionResponse } from './collection-v2.js'

export async function handleAddUserToProject(req: FastifyRequest, res: FastifyReply) {
  try {
    const query = z.object({ projectId: z.number(), userId: z.number() }).parse(req.body)

    await prisma.projectMember.create({
      data: { projectId: query.projectId, userId: query.userId, role: 0 },
    })
    res.send({ code: 200 })
  }
  catch (error) {
    res.send({ code: 400, error })
  }
}

export async function handleDeleteUserOfProject(req: FastifyRequest, res: FastifyReply) {
  try {
    const query = z.object({ projectId: z.number(), userId: z.number() }).parse(req.body)

    await prisma.projectMember.deleteMany({ where: { userId: query.userId, projectId: query.projectId } })
    res.send({ code: 200 })
  }
  catch (error) {
    res.send({ code: 400, error })
  }
}

export async function handleAddIcons(req: FastifyRequest, res: FastifyReply) {
  try {
    const v = z.object({
      projectId: z.number(),
      icons: z.array(z.object({ name: z.string(), svg: z.string() })),
    })
    const { projectId, icons } = v.parse(req.body)
    const iconMap = icons.reduce((pre, it) => {
      const parsed = parseSVGContent(it.svg)
      if (parsed) {
        const iconifyIcon = convertParsedSVG(parsed)
        if (iconifyIcon)
          pre[it.name] = iconifyIcon
      }
      return pre
    }, {} as Record<string, IconifyIcon>)

    const project = await prisma.project.findUnique({ where: { id: projectId } })
    if (!project) {
      return res.send({ code: 400, error: 'project is not found' })
    }
    // load icon set from db
    const iconSet = new IconSet(JSON.parse(project?.projectIconSetJSON as string) as IconifyJSON)
    // add icons to icon set
    for (const iconName in iconMap) {
      if (iconSet.exists(iconName)) {
        continue
      }
      iconSet.setIcon(iconName, iconMap[iconName])
    }
    // update to db and icons dir
    const newIconSetJSON = JSON.stringify(iconSet.export(true))
    await writeIconSet(project.prefix, newIconSetJSON)
    await prisma.project.update({
      where: { id: projectId },
      data: {
        projectIconSetJSON: newIconSetJSON,
        total: iconSet.count(),
      },
    })
    // update iconset data
    await triggerIconSetsUpdate(1)
    res.send({ code: 200 })
  }
  catch (error) {
    console.log(error)
    res.send({ code: 400, error })
  }
}

export async function handleMemberInfo(req: FastifyRequest, res: FastifyReply) {
  try {
    const query = z.object({ projectId: z.string().transform(v => Number.parseInt(v)) }).parse(req.query)
    const reqUser = req.user as User
    const member = await prisma.projectMember.findMany({
      where: { userId: reqUser.id, projectId: query.projectId },
    })
    res.send({ code: 200, data: member })
  }
  catch (error) {
    return res.send({ code: 400, error })
  }
}

export async function handleMemberList(req: FastifyRequest, res: FastifyReply) {
  try {
    const query = z.object({ projectId: z.string().transform(v => Number.parseInt(v)) }).parse(req.query)
    if (!query.projectId) {
      return res.send({ code: 400, error: 'project id is required' })
    }
    const members = await prisma.projectMember.findMany({
      where: { projectId: { equals: query.projectId } },
      include: { user: { select: { name: true } } },
    })
    res.send({ code: 200, data: members })
  }
  catch (error) {
    console.log(error)
    return res.send({ code: 400, error })
  }
}

export async function handleCreateProject(req: FastifyRequest, res: FastifyReply) {
  const reqUser = req.user as User
  try {
    const v = z.object({
      prefix: z.string(),
      name: z.string(),
      desc: z.string().default(''),
      userIds: z.array(z.number()),
      logo: z.string().default(''),
    })
    const { prefix, name, desc, userIds, logo } = v.parse(req.body)
    const iconset = new IconSet({
      prefix,
      info: {
        name,
        total: 0,
        version: '0.0.1',
        author: {
          name: reqUser.name,
          url: '/',
        },
        license: { title: 'MIT', spdx: 'MIT' },
        samples: [],
        height: 24,
        displayHeight: 24,
        palette: false,
        category: 'PROJECT',
      },
      width: 24,
      height: 24,
      icons: {},
    })

    const iconJson = iconset.export(true)
    const iconSetPath = path.join(`icons/${prefix}.json`)
    if (await fileExists(iconSetPath)) {
      return res.send({ code: 400, message: `${prefix} iconset existed` })
    }
    await fs.writeFile(iconSetPath, JSON.stringify(iconJson, null, 2))
    // update custom icon
    await triggerIconSetsUpdate(1)

    // create project record for db
    await prisma.project.create({
      data: {
        prefix,
        name,
        desc,
        projectIconSetJSON: JSON.stringify(iconJson),
        logo,
        projectMember: {
          createMany: {
            data: [
              { userId: reqUser.id, role: 1 },
              ...userIds.map(id => ({
                userId: id,
                role: 0,
              })),
            ],
          },
        },
      },
    })

    res.send({ code: 200, data: iconJson })
  }
  catch (error) {
    res.send({ code: 400, error })
  }
}

export async function queryAllProejcts(req: FastifyRequest, res: FastifyReply) {
  const reqUser = req.user as User
  try {
    const projects = await prisma.project.findMany({
      where: {
        projectMember: {
          some: {
            userId: reqUser.id,
          },
        },
      },
      select: { id: true, name: true, prefix: true, desc: true, total: true },
    })
    res.send({ code: 200, data: projects })
  }
  catch (error) {
    res.send({ code: 400, error })
  }
}

export async function queryProjectInfo(req: FastifyRequest, res: FastifyReply) {
  const query = z.object({ prefix: z.string() }).parse(req.query)
  const record = await prisma.project.findUnique({
    where: { prefix: query.prefix },
    select: {
      id: true,
      name: true,
      prefix: true,
      desc: true,
      total: true,
    },
  })
  const iconSet = createAPIv2CollectionResponse({ prefix: query.prefix })
  if (iconSet === 404) {
    return res.send({ code: 400, error: 'iconset returned 404' })
  }
  res.send({ code: 200, data: { ...record, ...((iconSet || {}) as APIv2CollectionResponse) } })
}

export async function handlePackSvgJson(req: FastifyRequest, res: FastifyReply) {
  try {
    const query = z.object({ projectId: z.string().transform(v => Number.parseInt(v)) }).parse(req.query)
    const record = await prisma.project.findUnique({
      where: { id: query.projectId },
      select: { projectIconSetJSON: true },
    })
    return { code: 200, data: record }
  }
  catch (error) {
    res.send({ code: 400, error })
  }
}

export async function handlePackSvgSymbolUse(req: FastifyRequest, res: FastifyReply) {
  try {
    const query = z.object({ projectId: z.string().transform(v => Number.parseInt(v)) }).parse(req.query)
    const record = await prisma.project.findUnique({
      where: { id: query.projectId },
      select: { projectIconSetJSON: true },
    })
    if (!record)
      throw new Error('record not found')
    const iconSet = new IconSet(JSON.parse(record?.projectIconSetJSON as string) as IconifyJSON)

    res.send({ code: 200, data: packSVGSprite(iconSet) })
  }
  catch (error) {
    console.log(error)
    res.send({ code: 400, error })
  }
}

export async function handleRemoveIconsFromProject(req: FastifyRequest, res: FastifyReply) {
  try {
    const q = z
      .object({
        projectId: z.number(),
        icons: z.array(z.string()),
      })
      .parse(req.body)

    const record = await prisma.project.findUnique({ where: { id: q.projectId } })
    if (!record)
      return res.send({ code: 400, error: 'project not found' })
    // parse to IconSet for add icons
    const iconSet = new IconSet(JSON.parse(record?.projectIconSetJSON as string) as IconifyJSON)
    q.icons.forEach(icon => iconSet.remove(icon))

    // write db & custom icons dir
    const newIconSetJSON = JSON.stringify(iconSet.export(true))
    await writeIconSet(record.prefix, newIconSetJSON)
    await prisma.project.update({
      where: { id: record.id },
      data: { projectIconSetJSON: newIconSetJSON, total: iconSet.count() },
    })
    // update iconset cache data
    await triggerIconSetsUpdate(1)

    res.send({ code: 200 })
  }
  catch (error) {
    res.send({ code: 400, error })
  }
}

export async function handleUploadIconsToProject(req: FastifyRequest, res: FastifyReply) {
  try {
    const { projectId, icons } = z
      .object({
        projectId: z.number(),
        icons: z.array(z.object({ name: z.string(), svg: z.string() })),
      })
      .parse(req.body)
    const record = await prisma.project.findUnique({ where: { id: projectId } })
    if (!record) {
      throw new Error('project not found')
    }
    const iconSet = new IconSet(JSON.parse(record?.projectIconSetJSON as string) as IconifyJSON)
    const sameNames = icons.reduce((pre, ic) => {
      if (iconSet.exists(ic.name)) {
        pre[ic.name] = 1
      }
      return pre
    }, {} as Record<string, 1>)
    if (Object.keys(sameNames).length > 0) {
      return res.send({ code: 200, data: { hasSame: Object.keys(sameNames).length, names: sameNames } })
    }
    // parse and set
    // eslint-disable-next-line array-callback-return
    icons.map((it) => {
      const parsed = parseSVGContent(it.svg)
      if (parsed) {
        const iconifyIcon = convertParsedSVG(parsed)
        if (iconifyIcon) {
          iconSet.setIcon(it.name, iconifyIcon)
        }
      }
    }, {} as Record<string, IconifyIcon>)
    // update to db and icons dir
    const newIconSetJSON = JSON.stringify(iconSet.export(true))
    await writeIconSet(record.prefix, newIconSetJSON)
    await prisma.project.update({
      where: { id: projectId },
      data: {
        projectIconSetJSON: newIconSetJSON,
        total: iconSet.count(),
      },
    })
    // update iconset data
    await triggerIconSetsUpdate(1)
    res.send({ code: 200 })
  }
  catch (error: any) {
    res.send({ code: 400, error: error?.message || JSON.stringify(error) })
  }
}
