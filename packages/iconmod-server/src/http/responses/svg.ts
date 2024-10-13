import type { IconifyIconCustomisations } from '@iconify/utils/lib/customisations/defaults'
import type { FastifyReply, FastifyRequest } from 'fastify'
import { cleanupSVG, deOptimisePaths, parseColors, runSVGO, SVG } from '@iconify/tools'
import { defaultIconCustomisations } from '@iconify/utils/lib/customisations/defaults'
import { flipFromString } from '@iconify/utils/lib/customisations/flip'
import { rotateFromString } from '@iconify/utils/lib/customisations/rotate'
import { defaultIconDimensions } from '@iconify/utils/lib/icon/defaults'
import { iconToSVG } from '@iconify/utils/lib/svg/build'
import { iconToHTML } from '@iconify/utils/lib/svg/html'
import { z } from 'zod'
import { getStoredIconData } from '../../data/icon-set/utils/get-icon.js'
import { iconSets } from '../../data/icon-sets.js'

/**
 * Generate SVG
 */
export function generateSVGResponse(prefix: string, name: string, query: FastifyRequest['query'], res: FastifyReply) {
  // Get icon set
  const iconSetItem = iconSets[prefix]?.item
  if (!iconSetItem) {
    // No such icon set
    res.send(404)
    return
  }

  // Check if icon exists
  const icons = iconSetItem.icons
  if (!(icons.visible[name] || icons.hidden[name]) && !iconSetItem.icons.chars?.[name]) {
    // No such icon
    res.send(404)
    return
  }

  // Get icon
  getStoredIconData(iconSetItem, name, (data) => {
    if (!data) {
      // Invalid icon
      res.send(404)
      return
    }

    const q = (query || {}) as Record<string, string>

    // Clean up customisations
    const customisations: IconifyIconCustomisations = {}

    // Dimensions
    customisations.width = q.width || defaultIconCustomisations.width
    customisations.height = q.height || defaultIconCustomisations.height

    // Rotation
    customisations.rotate = q.rotate ? rotateFromString(q.rotate, 0) : 0

    // Flip
    if (q.flip) {
      flipFromString(customisations, q.flip)
    }

    // Generate SVG
    const svg = iconToSVG(data, customisations)

    let body = svg.body
    if (q.box) {
      // Add bounding box
      body
        = `<rect x="${
          data.left || 0
        }" y="${
          data.top || 0
        }" width="${
          data.width || defaultIconDimensions.width
        }" height="${
          data.height || defaultIconDimensions.height
        }" fill="rgba(255, 255, 255, 0)" />${
          body}`
    }
    let html = iconToHTML(body, svg.attributes)

    // Change color
    const color = q.color
    if (color && html.includes('currentColor') && !color.includes('"')) {
      html = html.split('currentColor').join(color)
    }

    // Send SVG, optionally as attachment
    if (q.download) {
      res.header('Content-Disposition', `attachment; filename="${name}.svg"`)
    }
    res.type('image/svg+xml; charset=utf-8').send(html)
  })
}

export async function handleClearSvgs(req: FastifyRequest, res: FastifyReply) {
  try {
    const { svgs, dropColor } = z
      .object({
        dropColor: z.boolean().default(true),
        svgs: z.array(
          z.object({
            id: z.number(),
            name: z.string(),
            svg: z.string(),
          }),
        ),
      })
      .parse(req.body)
    const resutls = []
    const errors = []
    for (let index = 0; index < svgs.length; index++) {
      try {
        const it = svgs[index]
        const svg = new SVG(it.svg)
        cleanupSVG(svg)
        runSVGO(svg, {})
        deOptimisePaths(svg)
        if (dropColor) {
          await parseColors(svg, {
            defaultColor: 'currentColor',
            callback: (attr, colorStr) => {
              if (['stroke', 'fill'].includes(attr))
                return 'currentColor'
              return colorStr
            },
          })
        }
        resutls.push({ name: it.name, svg: svg.toMinifiedString() })
      }
      catch (error: any) {
        errors.push(error?.message || JSON.stringify(error))
      }
    }
    res.send({ code: 200, data: resutls, errors })
  }
  catch (error) {
    console.log(error)
    res.send({ code: 400, error })
  }
}
