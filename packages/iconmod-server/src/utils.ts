import type { IconSet } from '@iconify/tools'

const insertJs = `
function insertSvgIntoBodyFirstElement() {
    const div = document.createElement("div");
    div.innerHTML = window.__iconmod_svg_symbols__;
    const svgElement = div.querySelector("svg");
    if (svgElement) {
      svgElement.setAttribute("aria-hidden", "true");
      svgElement.style.position = "absolute";
      svgElement.style.width = "0";
      svgElement.style.height = "0";
      svgElement.style.overflow = "hidden";
      const firstChild = document.body.firstChild;
      if (firstChild) {
        document.body.insertBefore(svgElement, firstChild);
      } else {
        document.body.appendChild(svgElement);
      }
    }
}
if (["complete", "loaded", "interactive"].indexOf(document.readyState) >= 0) {
    setTimeout(insertSvgIntoBodyFirstElement, 0);
} else {
    document.removeEventListener("DOMContentLoaded", insertSvgIntoBodyFirstElement, false);
    document.addEventListener("DOMContentLoaded", insertSvgIntoBodyFirstElement, false);
}
`
export function packSVGSprite(iconSet: IconSet, options: any = {}) {
  if (iconSet.count() <= 0)
    return
  let symbols = ''

  iconSet.forEach((name) => {
    const icon = iconSet.toSVG(name)
    const { left, top, width, height } = icon?.viewBox || {}
    symbols += `<symbol id="${
      iconSet.prefix
    }:${name}" viewBox="${left} ${top} ${width} ${height}">${icon?.getBody()}</symbol>`
  })
  const svg = `window.__iconmod_svg_symbols__='<svg style="position:absolute;width:0px;height:0px;overflow:hidden;" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><defs>${symbols}</defs></svg>';${insertJs}`
  return svg
}
