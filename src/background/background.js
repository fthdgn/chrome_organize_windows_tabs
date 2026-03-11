importScripts("../shared/options.js", "../shared/utils.js", "../shared/actions.js", "../shared/theme.js")

chrome.contextMenus.onClicked.addListener(async (event) => {
  await actions.run(/** @type {Action} */ (String(event.menuItemId)))
})

chrome.action.onClicked.addListener(async () => {
  const opts = await options.get()
  await actions.run(opts.defaultAction)
})

chrome.runtime.onInstalled.addListener(async () => {
  const opts = await options.get()
  await chrome.action.setPopup({
    popup: opts.showDefaultActionPopup ? "src/popup/popup.html" : "",
  })
})

chrome.storage.onChanged.addListener(async (changes, areaName) => {
  if (areaName === "sync" && changes.colorCode !== undefined) {
    const colorCode = /** @type {string} */ (changes.colorCode.newValue)
    if (colorCode) {
      await theme.updateIcon(colorCode)
    } else {
      await theme.resetIcon()
    }
  }
})

void options.get().then(async (opts) => {
  if (opts.colorCode) {
    await theme.updateIcon(opts.colorCode)
  }
})

void chrome.contextMenus.removeAll().then(() => {
  for (const action of Object.values(actions.Action)) {
    if (action === actions.Action.DO_NOTHING) {
      continue
    }
    chrome.contextMenus.create({
      title: actions.getTitle(action),
      id: action,
      contexts: ["action"],
    })
  }
})
