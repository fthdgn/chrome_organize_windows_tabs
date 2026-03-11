const defaultActionInput = /** @type {HTMLSelectElement} */ (document.getElementById("defaultActionInput"))

const ignorePinnedTabsInput = /** @type {HTMLInputElement} */ (document.getElementById("ignorePinnedTabsInput"))

const ignorePopupWindowsInput = /** @type {HTMLInputElement} */ (document.getElementById("ignorePopupWindowsInput"))

const ignoreAppWindowsInput = /** @type {HTMLInputElement} */ (document.getElementById("ignoreAppWindowsInput"))

const showDefaultActionPopupInput = /** @type {HTMLInputElement} */ (
  document.getElementById("showDefaultActionPopupInput")
)

const colorCodeRadios = /** @type {NodeListOf<HTMLInputElement>} */ (
  document.querySelectorAll('input[name="colorCode"]')
)

const colorCodeInput = /** @type {HTMLInputElement} */ (document.getElementById("colorCodeInput"))

/** @type {Awaited<ReturnType<typeof theme.loadIcon>>} */
let iconData

/**
 * @param {string} color
 * @param {HTMLCanvasElement} canvas
 */
function drawPreview(color, canvas) {
  const size = canvas.width
  const imageData = theme.renderIcon(size, color, iconData)
  const ctx = /** @type {CanvasRenderingContext2D} */ (canvas.getContext("2d"))
  ctx.putImageData(imageData, 0, 0)
}

void theme.loadIcon().then((data) => {
  iconData = data
  for (const radio of colorCodeRadios) {
    const canvas = radio.parentElement?.querySelector("canvas")
    if (canvas && radio.value && radio.value !== "custom") {
      drawPreview(radio.value, /** @type {HTMLCanvasElement} */ (canvas))
    }
  }
  drawPreview(colorCodeInput.value, /** @type {HTMLCanvasElement} */ (document.getElementById("previewCustom")))
})

utils.localizeHtml()

Object.values(actions.Action).forEach((actionId) => {
  const opt = document.createElement("option")
  opt.value = actionId
  opt.textContent = actions.getTitle(actionId)
  defaultActionInput.appendChild(opt)
})

void options.get().then((opts) => {
  defaultActionInput.value = opts.defaultAction
  ignorePinnedTabsInput.checked = opts.ignorePinnedTabs
  ignorePopupWindowsInput.checked = opts.ignorePopupWindows
  ignoreAppWindowsInput.checked = opts.ignoreAppWindows
  showDefaultActionPopupInput.checked = opts.showDefaultActionPopup

  const presetValues = new Set(Array.from(colorCodeRadios, (r) => r.value))
  if (presetValues.has(opts.colorCode)) {
    for (const radio of colorCodeRadios) {
      radio.checked = radio.value === opts.colorCode
    }
  } else {
    const customRadio = /** @type {HTMLInputElement} */ (
      document.querySelector('input[name="colorCode"][value="custom"]')
    )
    customRadio.checked = true
    colorCodeInput.value = opts.colorCode
    drawPreview(opts.colorCode, /** @type {HTMLCanvasElement} */ (document.getElementById("previewCustom")))
  }
})

defaultActionInput.addEventListener("change", async () => {
  await options.set({ defaultAction: /** @type {Action} */ (defaultActionInput.value) })
})

ignorePinnedTabsInput.addEventListener("change", async () => {
  await options.set({
    ignorePinnedTabs: ignorePinnedTabsInput.checked,
  })
})

ignorePopupWindowsInput.addEventListener("change", async () => {
  await options.set({
    ignorePopupWindows: ignorePopupWindowsInput.checked,
  })
})

ignoreAppWindowsInput.addEventListener("change", async () => {
  await options.set({
    ignoreAppWindows: ignoreAppWindowsInput.checked,
  })
})

showDefaultActionPopupInput.addEventListener("change", async () => {
  await options.set({
    showDefaultActionPopup: showDefaultActionPopupInput.checked,
  })
  await chrome.action.setPopup({
    popup: showDefaultActionPopupInput.checked ? "src/popup/popup.html" : "",
  })
})

for (const radio of colorCodeRadios) {
  radio.addEventListener("change", async () => {
    if (radio.value === "custom") {
      await options.set({ colorCode: colorCodeInput.value })
    } else {
      await options.set({ colorCode: radio.value })
    }
  })
  if (radio.value === "custom") {
    radio.parentElement?.addEventListener("click", () => {
      colorCodeInput.click()
    })
  }
}

let debounceTimer = 0
colorCodeInput.addEventListener("input", () => {
  const customRadio = /** @type {HTMLInputElement} */ (
    document.querySelector('input[name="colorCode"][value="custom"]')
  )
  customRadio.checked = true
  drawPreview(colorCodeInput.value, /** @type {HTMLCanvasElement} */ (document.getElementById("previewCustom")))
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(async () => {
    await options.set({ colorCode: colorCodeInput.value })
  }, 300)
})
