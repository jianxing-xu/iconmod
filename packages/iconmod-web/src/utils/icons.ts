import { buildIcon, loadIcon } from 'iconify-icon'
import { encodeSvgForCss } from '@iconify/utils'
import { getTransformedId } from '../store'
import Base64 from './base64'
import { HtmlToJSX } from './htmlToJsx'
import { prettierCode } from './prettier'
import { svgToPngDataUrl } from './svgToPng'
import { mfetch } from './http'

// const API_ENTRY = 'https://api.iconify.design'
const API_ENTRY = 'http://localhost:3030'

export async function clearSvgs(svgs: any[], dropColor: boolean) {
  const res = await mfetch('/clearSVGs', { method: 'POST', body: JSON.stringify({ svgs, dropColor }) })
  return res.json().then(r => [r.data, r.errors])
}

export async function getSvgLocal(icon: string, size = '1em', color = 'currentColor') {
  const data = await loadIcon(icon)
  if (!data)
    return
  const built = buildIcon(data, { height: size })
  if (!built)
    return
  const xlink = built.body.includes('xlink:') ? ' xmlns:xlink="http://www.w3.org/1999/xlink"' : ''
  return `<svg xmlns="http://www.w3.org/2000/svg"${xlink} ${Object.entries(built.attributes).map(([k, v]) => `${k}="${v}"`).join(' ')}>${built.body}</svg>`.replaceAll('currentColor', color)
}

export async function getSvg(icon: string, size = '1em', color = 'currentColor') {
  return await getSvgLocal(icon, size, color)
    || await fetch(`${API_ENTRY}/${icon}.svg?inline=false&height=${size}&color=${encodeURIComponent(color)}`).then(r => r.text()) || ''
}

export async function getSvgSymbol(icon: string, size = '1em', color = 'currentColor') {
  const svgMarkup = await getSvg(icon, size, color)

  const symbolElem = document.createElementNS('http://www.w3.org/2000/svg', 'symbol')
  const node = document.createElement('div') // Create any old element
  node.innerHTML = svgMarkup

  // Grab the inner HTML and move into a symbol element
  symbolElem.innerHTML = node.querySelector('svg')!.innerHTML
  symbolElem.setAttribute('viewBox', node.querySelector('svg')!.getAttribute('viewBox')!)
  symbolElem.id = icon.replace(/:/, '-') // Simple slugify for quick symbol lookup

  return symbolElem?.outerHTML
}

export function toComponentName(icon: string) {
  return icon.split(/[:\-_]/).filter(Boolean).map(s => s[0].toUpperCase() + s.slice(1).toLowerCase()).join('')
}

export function ClearSvg(svgCode: string, reactJSX?: boolean) {
  const el = document.createElement('div')
  el.innerHTML = svgCode
  const svg = el.getElementsByTagName('svg')[0]
  const keep = ['viewBox', 'width', 'height', 'focusable', 'xmlns', 'xlink']
  for (const key of Object.values(svg.attributes)) {
    if (keep.includes(key.localName))
      continue
    svg.removeAttributeNode(key)
  }
  return HtmlToJSX(el.innerHTML, reactJSX)
}

export function SvgToJSX(svg: string, name: string, snippet: boolean) {
  const code = `
export function ${name}(props) {
  return (
    ${ClearSvg(svg, true).replace(/<svg (.*?)>/, '<svg $1 {...props}>')}
  )
}`
  if (snippet)
    return prettierCode(code, 'babel-ts')
  else
    return prettierCode(`import React from 'react'\n${code}\nexport default ${name}`, 'babel-ts')
}

export function SvgToTSX(svg: string, name: string, snippet: boolean, reactJSX = true) {
  let code = `
export function ${name}(props: SVGProps<SVGSVGElement>) {
  return (
    ${ClearSvg(svg, reactJSX).replace(/<svg (.*?)>/, '<svg $1 {...props}>')}
  )
}`

  code = snippet ? code : `import React, { SVGProps } from 'react'\n${code}\nexport default ${name}`
  return prettierCode(code, 'babel-ts')
}

export function SvgToQwik(svg: string, name: string, snippet: boolean) {
  let code = `
export function ${name}(props: QwikIntrinsicElements['svg'], key: string) {
  return (
    ${ClearSvg(svg, false).replace(/<svg (.*?)>/, '<svg $1 {...props} key={key}>')}
  )
}`

  code = snippet ? code : `import type { QwikIntrinsicElements } from '@builder.io/qwik'\n${code}\nexport default ${name}`
  return prettierCode(code, 'babel-ts')
}

export function SvgToVue(svg: string, name: string, isTs?: boolean) {
  const content = `
<template>
  ${ClearSvg(svg)}
</template>

<script>
export default {
  name: '${name}'
}
</script>`
  const code = isTs ? content.replace('<script>', '<script lang="ts">') : content
  return prettierCode(code, 'vue')
}

export function SvgToSolid(svg: string, name: string, snippet: boolean) {
  let code = `
export function ${name}(props: JSX.IntrinsicElements['svg']) {
  return (
    ${svg.replace(/<svg (.*?)>/, '<svg $1 {...props}>')}
  )
}`

  code = snippet ? code : `import type { JSX } from 'solid-js'\n${code}\nexport default ${name}`
  return prettierCode(code, 'babel-ts')
}

export function SvgToSvelte(svg: string) {
  return `${svg.replace(/<svg (.*?)>/, '<svg $1 {...$$$props}>')}`
}

export function SvgToAstro(svg: string) {
  return `
---
const props = Astro.props 
---

${svg.replace(/<svg (.*?)>/, '<svg $1 {...props}>')}
`
}

export function SvgToReactNative(svg: string, name: string, snippet: boolean) {
  function replaceTags(svg: string, replacements: {
    from: string
    to: string
  }[]): string {
    let result = svg
    replacements.forEach(({ from, to }) => {
      result = result.replace(new RegExp(`<${from}(.*?)>`, 'g'), `<${to}$1>`)
        .replace(new RegExp(`</${from}>`, 'g'), `</${to}>`)
    })
    return result
  }

  function generateImports(usedComponents: string[]): string {
    // Separate Svg from the other components
    const svgIndex = usedComponents.indexOf('Svg')
    if (svgIndex !== -1)
      usedComponents.splice(svgIndex, 1)

    // Join all other component names with a comma and wrap them in curly braces
    const componentsString = usedComponents.length > 0 ? `{ ${usedComponents.join(', ')} }` : ''

    // Return the consolidated import statement, ensuring Svg is imported as a default import
    return `import Svg, ${componentsString} from 'react-native-svg';`
  }

  const replacements: {
    from: string
    to: string
  }[] = [
    { from: 'svg', to: 'Svg' },
    { from: 'path', to: 'Path' },
    { from: 'g', to: 'G' },
    { from: 'circle', to: 'Circle' },
    { from: 'rect', to: 'Rect' },
    { from: 'line', to: 'Line' },
    { from: 'polyline', to: 'Polyline' },
    { from: 'polygon', to: 'Polygon' },
    { from: 'ellipse', to: 'Ellipse' },
    { from: 'text', to: 'Text' },
    { from: 'tspan', to: 'Tspan' },
    { from: 'textPath', to: 'TextPath' },
    { from: 'defs', to: 'Defs' },
    { from: 'use', to: 'Use' },
    { from: 'symbol', to: 'Symbol' },
    { from: 'linearGradient', to: 'LinearGradient' },
    { from: 'radialGradient', to: 'RadialGradient' },
    { from: 'stop', to: 'Stop' },
  ]

  const reactNativeSvgCode = replaceTags(ClearSvg(svg, true), replacements)
    .replace(/className=/g, '')
    .replace(/href=/g, 'xlinkHref=')
    .replace(/clip-path=/g, 'clipPath=')
    .replace(/fill-opacity=/g, 'fillOpacity=')
    .replace(/stroke-width=/g, 'strokeWidth=')
    .replace(/stroke-linecap=/g, 'strokeLinecap=')
    .replace(/stroke-linejoin=/g, 'strokeLinejoin=')
    .replace(/stroke-miterlimit=/g, 'strokeMiterlimit=')

  const svgComponents = replacements.map(({ to }) => to)
  const imports = generateImports(svgComponents.filter(component => reactNativeSvgCode.includes(component)))

  let code = `
${imports}

export function ${name}(props) {
 return (
    ${reactNativeSvgCode}
 )
}`

  if (!snippet)
    code = `import React from 'react';\n${code}\nexport default ${name}`

  return prettierCode(code, 'babel-ts')
}

export function SvgToDataURL(svg: string) {
  const base64 = `data:image/svg+xml;base64,${Base64.encode(svg)}`
  const plain = `data:image/svg+xml,${encodeSvgForCss(svg)}`
  // Return the shorter of the two data URLs
  return base64.length < plain.length ? base64 : plain
}

export async function getIconSnippet(icon: string, type: string, snippet = true, color = 'currentColor'): Promise<string | undefined> {
  if (!icon)
    return

  let url = `${API_ENTRY}/${icon}.svg`
  if (color !== 'currentColor')
    url = `${url}?color=${encodeURIComponent(color)}`

  switch (type) {
    case 'id':
      return getTransformedId(icon)
    case 'url':
      return url
    case 'html':
      return `<span class="iconify" data-icon="${icon}" data-inline="false"${color === 'currentColor' ? '' : ` style="color: ${color}"`}></span>`
    case 'css':
      return `background: url('${url}') no-repeat center center / contain;`
    case 'svg':
      return await getSvg(icon, '32', color)
    case 'png':
      return await svgToPngDataUrl(await getSvg(icon, '32', color))
    case 'svg-symbol':
      return await getSvgSymbol(icon, '32', color)
    case 'data_url':
      return SvgToDataURL(await getSvg(icon, undefined, color))
    case 'pure-jsx':
      return ClearSvg(await getSvg(icon, undefined, color))
    case 'jsx':
      return SvgToJSX(await getSvg(icon, undefined, color), toComponentName(icon), snippet)
    case 'tsx':
      return SvgToTSX(await getSvg(icon, undefined, color), toComponentName(icon), snippet)
    case 'qwik':
      return SvgToQwik(await getSvg(icon, undefined, color), toComponentName(icon), snippet)
    case 'vue':
      return SvgToVue(await getSvg(icon, undefined, color), toComponentName(icon))
    case 'vue-ts':
      return SvgToVue(await getSvg(icon, undefined, color), toComponentName(icon), true)
    case 'solid':
      return SvgToSolid(await getSvg(icon, undefined, color), toComponentName(icon), snippet)
    case 'svelte':
      return SvgToSvelte(await getSvg(icon, undefined, color))
    case 'astro':
      return SvgToAstro(await getSvg(icon, undefined, color))
    case 'react-native':
      return SvgToReactNative(await getSvg(icon, undefined, color), toComponentName(icon), snippet)
    case 'unplugin':
      return `import ${toComponentName(icon)} from '~icons/${icon.split(':')[0]}/${icon.split(':')[1]}'`
  }
}

export function getIconDownloadLink(icon: string) {
  return `${API_ENTRY}/${icon}.svg?download=true&inline=false&height=auto`
}

export function parseSVG(svgString: string) {
  const result = {
    viewBox: [0, 0, 0, 0],
    width: '',
    height: '',
    color: '',
    body: '',
  }

  // 解析 viewBox 属性
  const viewBoxMatch = svgString.match(/viewBox="([^"]+)"/)
  if (viewBoxMatch) {
    result.viewBox = viewBoxMatch[1].split(' ').map(Number)
  }

  // 解析 width 属性
  const widthMatch = svgString.match(/width="([^"]+)"/)
  if (widthMatch) {
    result.width = widthMatch[1]
  }

  // 解析 height 属性
  const heightMatch = svgString.match(/height="([^"]+)"/)
  if (heightMatch) {
    result.height = heightMatch[1]
  }

  // 解析 color 属性
  const colorMatch = svgString.match(/color="([^"]+)"/)
  if (colorMatch) {
    result.color = colorMatch[1]
  }

  // 解析 body 内容
  const bodyMatch = svgString.match(/<svg[^>]*>([\s\S]*)<\/svg>/)
  if (bodyMatch) {
    result.body = bodyMatch[1].trim()
  }

  // 解析其他属性
  const attributeRegex = /(\w+)="([^"]+)"/g
  let match: any
  // eslint-disable-next-line no-cond-assign
  while ((match = attributeRegex.exec(svgString)) !== null) {
    if (!['viewBox', 'width', 'height', 'color'].includes(match[1])) {
      // eslint-disable-next-line ts/ban-ts-comment
      // @ts-expect-error
      result[match[1]] = match[2]
    }
  }

  return result
}

export function convertSvgShapesToPath(svgString: string) {
  // 使用DOMParser将SVG字符串转换为DOM对象
  const parser = new DOMParser()
  const svgDoc = parser.parseFromString(svgString, 'image/svg+xml')
  const svgElement = svgDoc.documentElement

  // 获取所有形状元素
  const shapes = svgElement.querySelectorAll('rect, ellipse, line, polyline, polygon')

  shapes.forEach((shape) => {
    const pathData = shape2path(shape)

    if (typeof pathData === 'undefined') {
      throw new TypeError('convert error')
    }

    // 创建一个新的path元素
    const pathElement = document.createElementNS('http://www.w3.org/2000/svg', 'path')
    pathElement.setAttribute('d', pathData)

    // 复制原始形状的所有属性到新的path元素
    for (let i = 0; i < shape.attributes.length; i++) {
      const attr = shape.attributes[i]
      if (attr.name !== 'd') {
        pathElement.setAttribute(attr.name, attr.value)
      }
    }

    // 替换原始形状为新的path元素
    shape.parentNode?.replaceChild(pathElement, shape)
  })

  // 将修改后的SVG DOM对象转换回字符串
  const serializer = new XMLSerializer()
  return serializer.serializeToString(svgDoc)
}
export function shape2path(node: Element) {
  // 匹配路径中数值的正则
  const regNumber = /[-+]?(?:\d*\.\d+|\d+\.?)(?:e[-+]?\d+)?/gi

  if (!node?.tagName)
    return ''
  const tagName = String(node.tagName).toLowerCase()

  let path = ''

  switch (tagName) {
    case 'path':
    {
      path = node.getAttribute('d') as string
      break
    }
    case 'rect':
    {
      const x = Number(node.getAttribute('x'))
      const y = Number(node.getAttribute('y'))
      const width = Number(node.getAttribute('width'))
      const height = Number(node.getAttribute('height'))
      /*
                       * rx 和 ry 的规则是：
                       * 1. 如果其中一个设置为 0 则圆角不生效
                       * 2. 如果有一个没有设置则取值为另一个
                       * 3.rx 的最大值为 width 的一半, ry 的最大值为 height 的一半
                       */
      let rx = Number(node.getAttribute('rx')) || Number(node.getAttribute('ry')) || 0
      let ry = Number(node.getAttribute('ry')) || Number(node.getAttribute('rx')) || 0

      // 非数值单位计算，如当宽度像100%则移除
      // if (isNaN(x - y + width - height + rx - ry)) return;

      rx = rx > width / 2 ? width / 2 : rx
      ry = ry > height / 2 ? height / 2 : ry

      // 如果其中一个设置为 0 则圆角不生效
      if (rx === 0 || ry === 0) {
        // const path =
        //     'M' + x + ' ' + y +
        //     'H' + (x + width) +
        //     'V' + (y + height) +
        //     'H' + x +
        //     'z';
        path
            = `M${x} ${y}h${width}v${height}h${-width}z`
      }
      else {
        path = ''
        // path
        //   = `M${
        //     x
        //   } ${
        //     y + ry
        //   }a${
        //     rx
        //   } ${
        //     ry
        //   } 0 0 1 ${
        //     rx
        //   } ${
        //     -ry
        //   }h${
        //     width - rx - rx
        //   }a${
        //     rx
        //   } ${
        //     ry
        //   } 0 0 1 ${
        //     rx
        //   } ${
        //     ry
        //   }v${
        //     height - ry - ry
        //   }a${
        //     rx
        //   } ${
        //     ry
        //   } 0 0 1 ${
        //     -rx
        //   } ${
        //     ry
        //   }h${
        //     rx + rx - width
        //   }a${
        //     rx
        //   } ${
        //     ry
        //   } 0 0 1 ${
        //     -rx
        //   } ${
        //     -ry
        //   }z`
      }

      break
    }

    case 'circle':
    {
      const cx = Number(node.getAttribute('cx')) || 0
      const cy = Number(node.getAttribute('cy')) || 0
      const r = Number(node.getAttribute('r')) || 0
      path
          = `M${cx - r
        } ${cy
        }a${r
        } ${r
        } 0 1 0 ${2 * r
        } 0`
        + `a${r
        } ${r
        } 0 1 0 ${-2 * r
        } 0`
        + `z`

      break
    }

    case 'ellipse':
    {
      const cx = Number(node.getAttribute('cx') || 0) * 1
      const cy = Number(node.getAttribute('cy') || 0) * 1
      const rx = Number(node.getAttribute('rx') || 0) * 1
      const ry = Number(node.getAttribute('ry') || 0) * 1

      if (Number.isNaN(cx - cy + rx - ry))
        return
      path
          = `M${cx - rx
        } ${cy
        }a${rx
        } ${ry
        } 0 1 0 ${2 * rx
        } 0`
        + `a${rx
        } ${ry
        } 0 1 0 ${-2 * rx
        } 0`
        + `z`

      break
    }

    case 'line':
    {
      const x1 = Number(node.getAttribute('x1') || 0)
      const y1 = Number(node.getAttribute('y1') || 0)
      const x2 = Number(node.getAttribute('x2') || 0)
      const y2 = Number(node.getAttribute('y2') || 0)
      if (Number.isNaN(x1 - y1 + (x2 - y2))) {
        return
      }

      path = `M${x1} ${y1}L${x2} ${y2}`

      break
    }

    case 'polygon':
    case 'polyline':
    // ploygon与polyline是一样的,polygon多边形，polyline折线
    {
      const points = (node?.getAttribute('points')?.match(regNumber) || []).map(Number)
      if (points.length < 4) {
        return
      }
      path
          = `M${points.slice(0, 2).join(' ')
        }L${points.slice(2).join(' ')
        }${tagName === 'polygon' ? 'z' : ''}`

      break
    }
  }
  return path || ''
}

export const REMOVE_ICON_PRE = /^[^a-z0-9]+(?=[a-z0-9-])/
export const REMOVE_ICON_SUFIX = /[^a-z0-9]+$/
export const REMOVE_ICON_CHAT = `this.value=this.value.replace(/[^a-z-]/g, '').replace(${REMOVE_ICON_PRE}, '').replace(${REMOVE_ICON_SUFIX}, '')`
export function adjustIconname(input: string) {
  let cleaned = input.replace(/[^a-z-]/g, '')
  // remove prefix illigel chat
  cleaned = cleaned.replace(REMOVE_ICON_PRE, '')

  // remove suffix iglligel chat
  cleaned = cleaned.replace(REMOVE_ICON_SUFIX, '')

  return cleaned
}
