importScripts("../shared/options.js", "../shared/utils.js", "../shared/actions.js", "../shared/theme.js")

chrome.commands.onCommand.addListener(async (command) => {
  await actions.run(command)
})

chrome.contextMenus.onClicked.addListener(async (event) => {
  await actions.run(String(event.menuItemId))
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
  if (areaName !== "sync") return
  if (changes.colorCode !== undefined) {
    const colorCode = /** @type {string} */ (changes.colorCode.newValue)
    if (colorCode) {
      await theme.updateIcon(colorCode)
    } else {
      await theme.resetIcon()
    }
  }
  if (changes.actionOrder !== undefined) {
    await createContextMenus()
  }
})

void options.get().then(async (opts) => {
  if (opts.colorCode) {
    await theme.updateIcon(opts.colorCode)
  }
})

async function createContextMenus() {
  await chrome.contextMenus.removeAll()
  const opts = await options.get()
  const items = actions.getOrderedActions(opts.actionOrder)
  const limit = chrome.contextMenus.ACTION_MENU_TOP_LEVEL_LIMIT
  const useParent = items.length > limit
  const topCount = useParent ? limit - 1 : items.length
  for (let i = 0; i < topCount; i++) {
    chrome.contextMenus.create({
      title: actions.getTitle(items[i]),
      id: items[i],
      contexts: ["action"],
    })
  }
  if (useParent) {
    chrome.contextMenus.create({
      title: chrome.i18n.getMessage("options_action_order_top_level"),
      id: "parent",
      contexts: ["action"],
    })
    for (let i = topCount; i < items.length; i++) {
      chrome.contextMenus.create({
        title: actions.getTitle(items[i]),
        id: items[i],
        parentId: "parent",
        contexts: ["action"],
      })
    }
  }
}

void createContextMenus()
