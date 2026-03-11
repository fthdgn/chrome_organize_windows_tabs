/** @type {{ viewBox: { x: number, y: number, width: number, height: number }, path: Path2D } | null} */
let icon = null

async function loadIcon() {
  if (icon) return icon
  const url = chrome.runtime.getURL("icons/icon.svg")
  const text = await fetch(url).then((r) => r.text())
  const [, x, y, w, h] = /** @type {RegExpMatchArray} */ (
    text.match(/viewBox="([\d.-]+)\s+([\d.-]+)\s+([\d.-]+)\s+([\d.-]+)"/)
  )
  const [, d] = /** @type {RegExpMatchArray} */ (text.match(/\bd="([^"]+)"/))
  icon = { viewBox: { x: +x, y: +y, width: +w, height: +h }, path: new Path2D(d) }
  return icon
}

/**
 * @param {number} size
 * @param {string} color
 * @param {{ viewBox: { x: number, y: number, width: number, height: number }, path: Path2D }} iconData
 * @returns {ImageData}
 */
function renderIcon(size, color, iconData) {
  const { viewBox, path } = iconData
  const hi = size * 3
  const hiCanvas = new OffscreenCanvas(hi, hi)
  const hiCtx = /** @type {OffscreenCanvasRenderingContext2D} */ (hiCanvas.getContext("2d"))
  hiCtx.scale(hi / viewBox.width, hi / viewBox.height)
  hiCtx.translate(-viewBox.x, -viewBox.y)
  hiCtx.fillStyle = color
  hiCtx.fill(path)

  const canvas = new OffscreenCanvas(size, size)
  const ctx = /** @type {OffscreenCanvasRenderingContext2D} */ (canvas.getContext("2d"))
  ctx.drawImage(hiCanvas, 0, 0, size, size)
  return ctx.getImageData(0, 0, size, size)
}

/**
 * @param {string} color
 * @returns {Promise<void>}
 */
async function updateIcon(color) {
  const iconData = await loadIcon()
  await chrome.action.setIcon({
    imageData: {
      16: renderIcon(16, color, iconData),
      32: renderIcon(32, color, iconData),
      48: renderIcon(48, color, iconData),
      128: renderIcon(128, color, iconData),
    },
  })
}

/**
 * @returns {Promise<void>}
 */
async function resetIcon() {
  const entries = Object.entries(chrome.runtime.getManifest().action.default_icon)
  const path = Object.fromEntries(entries.map(([s, p]) => [s, chrome.runtime.getURL(p)]))
  await chrome.action.setIcon({ path })
}

// eslint-disable-next-line no-unused-vars
const theme = { loadIcon, updateIcon, resetIcon, renderIcon }
