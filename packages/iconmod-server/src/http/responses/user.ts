import type { User } from '@prisma/client'
import type { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'
import { prisma } from '../../data/prisma.js'

export async function handleRegister(req: FastifyRequest, res: FastifyReply) {
  try {
    const body = z
      .object({
        email: z.string(),
        name: z.string(),
        pwd: z.string().min(6),
      })
      .parse(req.body)
    const record = await prisma.user.create({
      data: {
        email: body.email,
        name: body.name,
        pwd: body.pwd,
      },
      include: {
        projectMembers: true,
      },
    })
    const { pwd: _, ...o } = record
    res.setCookie('iconmod-token', await res.jwtSign(o))
    res.send({ code: 200, data: o })
  }
  catch (error) {
    res.send({ code: 400, error })
  }
}

export async function handleLogin(req: FastifyRequest, res: FastifyReply) {
  try {
    const body = z.object({ email: z.string(), pwd: z.string() }).parse(req.body)

    const user = await prisma.user.findUnique({ where: { email: body.email } })
    if (!user)
      return res.send({ code: 400, error: 'user not found' })
    const { pwd, ...o } = user
    if (body.pwd !== pwd)
      return res.send({ code: 400, error: 'email or pwd error' })

    const token = await res.jwtSign(o)
    res.setCookie('iconmod-token', token, {
      expires: new Date(Date.now() + 86400000),
      path: '/',
    })

    res.send({ code: 200, data: user, token })
  }
  catch (error) {
    res.send({ code: 400, error })
  }
}

export function handleUserInfo(req: FastifyRequest, res: FastifyReply) {
  const { iat, ...user } = req.user as User & { iat: number }
  res.send({ code: 200, data: user })
}

export async function handleSearchUser(req: FastifyRequest, res: FastifyReply) {
  const query = z.object({ keyword: z.string().default('') }).parse(req.query)
  if (!query.keyword.trim()) {
    return res.send({ code: 200, data: [] })
  }
  try {
    const records = await prisma.user.findMany({
      where: { name: { contains: query.keyword.trim() } },
      select: { id: true, name: true, email: true },
    })
    res.header('cache-control', 'no-cache')
    res.send({ code: 200, data: records })
  }
  catch (error) {
    res.send({ code: 200, error })
  }
}
