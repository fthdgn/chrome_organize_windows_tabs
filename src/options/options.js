const actionOrderList = /** @type {HTMLUListElement} */ (document.getElementById("actionOrderList"))

// One slot is reserved for the "Other actions" parent menu when items overflow
const TOP_LEVEL_LIMIT = chrome.contextMenus.ACTION_MENU_TOP_LEVEL_LIMIT - 1

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

/**
 * @param {string} actionValue
 */
async function setDefaultAction(actionValue) {
  await options.set({ defaultAction: /** @type {Action} */ (actionValue) })
  for (const li of actionOrderList.querySelectorAll("li")) {
    const star = li.querySelector(".star-icon")
    if (!star) continue
    const isDefault = /** @type {HTMLElement} */ (li).dataset.action === actionValue
    star.textContent = isDefault ? "★" : "☆"
    star.classList.toggle("active", isDefault)
  }
}

/**
 * @param {string[]} order
 * @param {string} defaultAction
 */
function renderActionOrder(order, defaultAction) {
  actionOrderList.innerHTML = ""

  const doNothingLi = document.createElement("li")
  doNothingLi.className = "no-drag"
  doNothingLi.dataset.action = actions.Action.DO_NOTHING
  const doNothingLabel = document.createElement("span")
  doNothingLabel.textContent = actions.getTitle(actions.Action.DO_NOTHING)
  doNothingLi.appendChild(doNothingLabel)
  const doNothingStar = document.createElement("span")
  doNothingStar.className = "star-icon" + (defaultAction === actions.Action.DO_NOTHING ? " active" : "")
  doNothingStar.textContent = defaultAction === actions.Action.DO_NOTHING ? "★" : "☆"
  doNothingStar.addEventListener("click", () => setDefaultAction(actions.Action.DO_NOTHING))
  doNothingLi.appendChild(doNothingStar)
  actionOrderList.appendChild(doNothingLi)

  for (let i = 0; i < order.length; i++) {
    if (i === TOP_LEVEL_LIMIT) {
      const divider = document.createElement("li")
      divider.className = "divider"
      divider.textContent = "▼ " + chrome.i18n.getMessage("options_action_order_top_level") + " ▼"
      actionOrderList.appendChild(divider)
    }
    const li = document.createElement("li")
    li.draggable = true
    li.dataset.action = order[i]
    const handle = document.createElement("span")
    handle.className = "drag-handle"
    handle.textContent = "☰"
    li.appendChild(handle)
    const label = document.createElement("span")
    label.textContent = actions.getTitle(/** @type {Action} */ (order[i]))
    li.appendChild(label)
    const star = document.createElement("span")
    star.className = "star-icon" + (order[i] === defaultAction ? " active" : "")
    star.textContent = order[i] === defaultAction ? "★" : "☆"
    star.addEventListener("click", () => setDefaultAction(order[i]))
    li.appendChild(star)
    actionOrderList.appendChild(li)
  }
}

/** @type {HTMLLIElement | null} */
let dragItem = null

function clearDropIndicators() {
  for (const el of actionOrderList.querySelectorAll(".drop-before, .drop-after")) {
    el.classList.remove("drop-before", "drop-after")
  }
}

actionOrderList.addEventListener("dragstart", (e) => {
  const li = /** @type {HTMLElement} */ (e.target).closest("li")
  if (!li || li.classList.contains("divider") || li.classList.contains("no-drag")) return
  dragItem = /** @type {HTMLLIElement} */ (li)
  li.classList.add("dragging")
})

actionOrderList.addEventListener("dragover", (e) => {
  e.preventDefault()
  const li = /** @type {HTMLElement} */ (e.target).closest("li")
  if (!li || li === dragItem || li.classList.contains("divider") || li.classList.contains("no-drag")) return
  clearDropIndicators()
  const rect = li.getBoundingClientRect()
  const isTop = e.clientY < rect.top + rect.height / 2
  li.classList.add(isTop ? "drop-before" : "drop-after")
})

actionOrderList.addEventListener("dragleave", (e) => {
  const li = /** @type {HTMLElement} */ (e.target).closest("li")
  if (li) li.classList.remove("drop-before", "drop-after")
})

actionOrderList.addEventListener("drop", async (e) => {
  e.preventDefault()
  const target = /** @type {HTMLElement} */ (e.target).closest("li")
  if (
    !target ||
    !dragItem ||
    target === dragItem ||
    target.classList.contains("divider") ||
    target.classList.contains("no-drag")
  )
    return
  const insertBefore = target.classList.contains("drop-before")
  clearDropIndicators()
  const items = /** @type {HTMLLIElement[]} */ (
    Array.from(actionOrderList.querySelectorAll("li:not(.divider):not(.no-drag)"))
  )
  const fromIndex = items.indexOf(dragItem)
  let toIndex = items.indexOf(/** @type {HTMLLIElement} */ (target))
  if (fromIndex === -1 || toIndex === -1) return
  const order = /** @type {string[]} */ (items.map((li) => li.dataset.action).filter(Boolean))
  const [moved] = order.splice(fromIndex, 1)
  if (fromIndex < toIndex) toIndex--
  order.splice(insertBefore ? toIndex : toIndex + 1, 0, moved)
  const pinnedLi = /** @type {HTMLElement | null} */ (actionOrderList.querySelector("li:has(.active)"))
  renderActionOrder(order, pinnedLi?.dataset.action || order[0])
  await options.set({ actionOrder: order })
})

actionOrderList.addEventListener("dragend", () => {
  if (dragItem) dragItem.classList.remove("dragging")
  dragItem = null
  clearDropIndicators()
})

utils.localizeHtml()

void options.get().then((opts) => {
  ignorePinnedTabsInput.checked = opts.ignorePinnedTabs
  ignorePopupWindowsInput.checked = opts.ignorePopupWindows
  ignoreAppWindowsInput.checked = opts.ignoreAppWindows
  showDefaultActionPopupInput.checked = opts.showDefaultActionPopup

  renderActionOrder(actions.getOrderedActions(opts.actionOrder), opts.defaultAction)

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
