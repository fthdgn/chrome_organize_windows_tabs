const defaultActionInput = /** @type {HTMLSelectElement} */ (document.getElementById("defaultActionInput"))

const ignorePinnedTabsInput = /** @type {HTMLInputElement} */ (document.getElementById("ignorePinnedTabsInput"))

const ignorePopupWindowsInput = /** @type {HTMLInputElement} */ (document.getElementById("ignorePopupWindowsInput"))

const ignoreAppWindowsInput = /** @type {HTMLInputElement} */ (document.getElementById("ignoreAppWindowsInput"))

const showDefaultActionPopupInput = /** @type {HTMLInputElement} */ (
  document.getElementById("showDefaultActionPopupInput")
)

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
