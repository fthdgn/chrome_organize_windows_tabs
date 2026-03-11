importScripts("../shared/options.js", "../shared/utils.js", "../shared/actions.js")

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
