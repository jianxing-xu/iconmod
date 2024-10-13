import type { IconCSSIconSetOptions } from '@iconify/utils/lib/css/types'
import type { FastifyReply, FastifyRequest } from 'fastify'
import { stringToColor } from '@iconify/utils/lib/colors'
import { getIconsCSS } from '@iconify/utils/lib/css/icons'
import { getStoredIconsData } from '../../data/icon-set/utils/get-icons.js'
import { iconSets } from '../../data/icon-sets.js'
import { paramToBoolean } from '../../misc/bool.js'

/**
 * Check selector for weird stuff
 */
function checkSelector(value: string | undefined): boolean {
  if (typeof value !== 'string') {
    return false
  }
  const cleanValue = value.replaceAll('{name}', '').replaceAll('{prefix}', '')
  return !cleanValue.includes('{') && !cleanValue.includes('}')
}

/**
 * Generate icons style
 */
export function generateIconsStyleResponse(prefix: string, query: FastifyRequest['query'], res: FastifyReply) {
  const q = (query || {}) as Record<string, string>
  const names = q.icons?.split(',')

  if (!names || !names.length) {
    // Missing or invalid icons parameter
    res.send(404)
    return
  }

  // Get icon set
  const iconSet = iconSets[prefix]
  if (!iconSet) {
    // No such icon set
    res.send(404)
    return
  }

  // Get icons
  getStoredIconsData(iconSet.item, names, (data) => {
    // Options
    const options: IconCSSIconSetOptions = {}
    const qOptions = q as IconCSSIconSetOptions

    if (typeof qOptions.format === 'string') {
      const format = qOptions.format
      switch (format) {
        case 'compact':
        case 'compressed':
        case 'expanded':
          options.format = format
      }
    }

    // 'color': string
    // Sets color for monotone images
    const color = qOptions.color
    if (typeof color === 'string' && stringToColor(color)) {
      options.color = color
    }

    // 'mode': string
    // Forces mode
    // Alias for 'background': 'bg'
    const mode = qOptions.mode
    if (mode) {
      switch (mode) {
        case 'background':
        case 'mask':
          options.mode = mode

        // eslint-disable-next-line no-fallthrough
        default:
          if ((mode as string) === 'bg') {
            options.mode = 'background'
          }
      }
    }

    // 'forceSquare': boolean
    // Forces icon to be square, regardless of width/height ratio
    // Aliases: 'square', 'force-square'
    const forceSquare = paramToBoolean(q.square || q.forceSquare || q['force-square'], void 0)
    if (typeof forceSquare === 'boolean') {
      options.forceSquare = forceSquare
    }

    // 'pseudoSelector': boolean
    // Adds `content: '';` to common selector. Useful when selector is a pseudo-selector
    // Aliases: 'pseudo', 'pseudo-selector'
    const pseudoSelector = paramToBoolean(q.pseudo || q.pseudoSelector || q['pseudo-selector'], void 0)
    if (typeof pseudoSelector === 'boolean') {
      options.pseudoSelector = pseudoSelector
    }

    // 'commonSelector': string
    // Common selector for all requested icons
    // Alias: 'common'
    const commonSelector = qOptions.commonSelector || q.common
    if (checkSelector(commonSelector)) {
      options.commonSelector = commonSelector
    }

    // 'iconSelector': string
    // Icon selector
    // Alias: 'selector'
    const iconSelector = qOptions.iconSelector || q.selector
    if (checkSelector(iconSelector)) {
      options.iconSelector = iconSelector
    }

    // 'overrideSelector': string
    // Selector for rules in icon that override common rules
    // Alias: 'override'
    const overrideSelector = qOptions.overrideSelector || q.override
    if (checkSelector(overrideSelector)) {
      options.overrideSelector = overrideSelector
    }

    // 'varName': string
    // Variable name
    // Alias: 'var'
    const varName = q.varName || q.var
    if (typeof varName === 'string' && varName.match(/^[a-z0-9_-]*$/)) {
      if (!varName || varName === 'null' || !paramToBoolean(varName, true)) {
        options.varName = null
      }
      else {
        options.varName = varName
      }
    }

    // Generate css
    const css = getIconsCSS(
      {
        // Data
        ...data,
        // Info to detect palette
        info: iconSet.item.info,
      },
      names,
      options,
    )

    // Send CSS, optionally as attachment
    if (q.download) {
      res.header('Content-Disposition', `attachment; filename="${prefix}.css"`)
    }

    res.type('text/css; charset=utf-8').send(css)
  })
}
