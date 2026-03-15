const DO_NOTHING = "do_nothing"

/** @type {string[]} */
const allActions = Object.keys(chrome.runtime.getManifest().commands ?? {})

/**
 * @param {string} action
 * @returns {string}
 */
function getTitle(action) {
  return chrome.i18n.getMessage("action_" + action)
}

/**
 * @param {string} action
 * @returns {Promise<void>}
 */
async function run(action) {
  if (action === "merge_and_sort") {
    await mergeWindowsAndSortTabsAction()
  } else if (action === "merge") {
    await mergeWindowsAction()
  } else if (action === "sort") {
    await sortTabsAction()
  } else if (action === "close_tabs_from_this_domain") {
    await closeTabsFromCurrentDomainAction()
  } else if (action === "move_tabs_from_this_domain") {
    await moveTabsFromCurrentDomainAction()
  } else if (action === "group_tabs_from_this_domain") {
    await groupTabsFromCurrentDomainAction()
  } else if (action === "close_duplicate_tabs") {
    await closeDuplicateTabsAction()
  } else if (action === "move_tabs_from_this_domain_to_new_window") {
    await moveTabsFromCurrentDomainToNewWindowAction()
  } else if (action === "separate_windows_by_domain") {
    await separateWindowsByDomainAction()
  }
}

/**
 * @param {URL} url
 * @returns {Promise<chrome.tabs.Tab[]>}
 */
async function getTabsFromDomain(url) {
  const opts = await options.get()
  return await chrome.tabs.query({
    groupId: chrome.tabGroups.TAB_GROUP_ID_NONE,
    url: url.protocol + "//" + url.host + "/*",
    pinned: opts.ignorePinnedTabs ? false : undefined,
  })
}

async function mergeWindowsAndSortTabsAction() {
  await mergeWindows()
  await sortTabs()
}

async function mergeWindowsAction() {
  await mergeWindows()
}

async function sortTabsAction() {
  await sortTabs()
}

async function closeTabsFromCurrentDomainAction() {
  const selectedTab = (await chrome.tabs.query({ active: true, currentWindow: true }))[0]
  if (!selectedTab?.url) return
  const url = new URL(selectedTab.url)
  const tabs = await getTabsFromDomain(url)
  for (const tab of tabs) {
    const tabId = tab.id
    if (tabId === undefined) continue
    await chrome.tabs.remove(tabId)
  }
}

async function moveTabsFromCurrentDomainAction() {
  const selectedTab = (await chrome.tabs.query({ active: true, currentWindow: true }))[0]
  if (!selectedTab?.url) return
  const url = new URL(selectedTab.url)
  const tabs = await getTabsFromDomain(url)
  for (const tab of tabs) {
    const tabId = tab.id
    if (tabId === undefined) continue
    await chrome.tabs.move(tabId, {
      windowId: selectedTab.windowId,
      index: -1,
    })
    if (tab.pinned === true) {
      await chrome.tabs.update(tabId, { pinned: true })
    }
  }
}

async function groupTabsFromCurrentDomainAction() {
  const selectedTab = (await chrome.tabs.query({ active: true, currentWindow: true }))[0]
  if (!selectedTab?.url) return
  const url = new URL(selectedTab.url)
  const tabs = await getTabsFromDomain(url)
  const tabIds = tabs.map((tab) => tab.id).filter((id) => id !== undefined)
  if (!utils.isNonEmptyArray(tabIds)) return
  const existingGroups = await chrome.tabGroups.query({ title: url.host })
  if (existingGroups.length > 0) {
    const existingGroupId = existingGroups[0].id
    await chrome.tabs.group({ groupId: existingGroupId, tabIds: tabIds })
  } else {
    const groupId = await chrome.tabs.group({ tabIds: tabIds })
    await chrome.tabGroups.update(groupId, { title: url.host })
  }
}

async function moveTabsFromCurrentDomainToNewWindowAction() {
  const selectedTab = (await chrome.tabs.query({ active: true, currentWindow: true }))[0]
  if (!selectedTab?.url) return
  const url = new URL(selectedTab.url)
  const tabs = await getTabsFromDomain(url)
  const tabIds = tabs.map((tab) => tab.id).filter((id) => id !== undefined)
  if (!utils.isNonEmptyArray(tabIds)) return
  const newWindow = await chrome.windows.create({ tabId: tabIds[0] })
  if (!newWindow?.id) return
  for (const tabId of tabIds.slice(1)) {
    await chrome.tabs.move(tabId, { windowId: newWindow.id, index: -1 })
  }
}

async function separateWindowsByDomainAction() {
  const opts = await options.get()
  const currentWindow = await chrome.windows.getCurrent()
  const windows = await chrome.windows.getAll({ populate: true })
  const selectedTab = (await chrome.tabs.query({ active: true, currentWindow: true }))[0]
  const currentHost = selectedTab?.url ? new URL(selectedTab.url).host : ""

  /** @type {Map<string, number[]>} */
  const domainTabs = new Map()

  for (const window of windows) {
    if (opts.ignoreAppWindows && window.type === "app") continue
    if (opts.ignorePopupWindows && window.type === "popup") continue

    for (const tab of window.tabs || []) {
      if (opts.ignorePinnedTabs && tab.pinned) continue
      if (tab.id === undefined || !tab.url) continue
      const host = new URL(tab.url).host
      if (!host) continue
      if (!domainTabs.has(host)) domainTabs.set(host, [])
      domainTabs.get(host)?.push(tab.id)
    }
  }

  for (const [host, tabIds] of domainTabs) {
    if (host === currentHost) {
      await chrome.tabs.move(tabIds, { windowId: currentWindow.id, index: -1 })
    } else {
      const newWindow = await chrome.windows.create({ tabId: tabIds[0] })
      if (!newWindow?.id) continue
      if (tabIds.length > 1) {
        await chrome.tabs.move(tabIds.slice(1), { windowId: newWindow.id, index: -1 })
      }
    }
  }
}

async function closeDuplicateTabsAction() {
  const opts = await options.get()
  const tabs = await chrome.tabs.query({
    pinned: opts.ignorePinnedTabs ? false : undefined,
  })
  /** @type {Set<string>} */
  const seen = new Set()
  /** @type {number[]} */
  const duplicates = []
  for (const tab of tabs) {
    if (tab.id === undefined || !tab.url) continue
    if (seen.has(tab.url)) {
      duplicates.push(tab.id)
    } else {
      seen.add(tab.url)
    }
  }
  if (duplicates.length > 0) {
    await chrome.tabs.remove(duplicates)
  }
}

async function mergeWindows() {
  const opts = await options.get()
  const currentWindow = await chrome.windows.getCurrent()
  const windows = await chrome.windows.getAll({ populate: true })

  for (const window of windows) {
    if (window.id === currentWindow.id) {
      continue
    }
    if (opts.ignoreAppWindows && window.type === "app") {
      continue
    }
    if (opts.ignorePopupWindows && window.type === "popup") {
      continue
    }

    for (const tab of window.tabs || []) {
      if (opts.ignorePinnedTabs && tab.pinned) {
        continue
      }

      const tabId = tab.id
      if (tabId === undefined) continue

      if (tab.groupId !== chrome.tabGroups.TAB_GROUP_ID_NONE) {
        await chrome.tabGroups.move(tab.groupId, {
          windowId: currentWindow.id,
          index: -1,
        })
      } else {
        await chrome.tabs.move(tabId, {
          windowId: currentWindow.id,
          index: -1,
        })
      }

      if (tab.pinned === true) {
        await chrome.tabs.update(tabId, { pinned: true })
      }
    }
  }
}

/**
 * @param {string} host
 * @returns {string}
 */
function reverseDomain(host) {
  return host.split(".").reverse().join(".")
}

/**
 * @param {string} url
 * @param {string} mode
 * @returns {string}
 */
function sortKey(url, mode) {
  if (mode === "domain") {
    const parsed = new URL(url)
    return reverseDomain(parsed.host) + parsed.pathname + parsed.search
  }
  return url
}

async function sortTabs() {
  const opts = await options.get()
  const currentWindow = await chrome.windows.getCurrent({ populate: true })
  let tabs = currentWindow.tabs || []
  if (opts.ignorePinnedTabs) {
    tabs = tabs.filter((tab) => !tab.pinned)
  }

  const dir = opts.sortDirection === "asc" ? 1 : -1

  tabs.sort(function (a, b) {
    if (a.groupId < b.groupId) {
      return -1
    } else if (a.groupId > b.groupId) {
      return 1
    } else {
      const aKey = sortKey(a.url || "", opts.sortMode)
      const bKey = sortKey(b.url || "", opts.sortMode)
      if (aKey < bKey) {
        return -1 * dir
      } else if (aKey > bKey) {
        return 1 * dir
      } else {
        return 0
      }
    }
  })

  for (const tab of tabs) {
    const tabId = tab.id
    if (tabId === undefined) continue

    if (tab.groupId !== chrome.tabGroups.TAB_GROUP_ID_NONE) {
      await chrome.tabGroups.move(tab.groupId, {
        windowId: currentWindow.id,
        index: -1,
      })
    } else {
      await chrome.tabs.move(tabId, { windowId: currentWindow.id, index: -1 })
    }

    if (tab.pinned === true) {
      await chrome.tabs.update(tabId, { pinned: true })
    }
  }
}

/**
 * @param {string[]} savedOrder
 * @returns {string[]}
 */
function getOrderedActions(savedOrder) {
  const all = allActions.slice()
  if (savedOrder.length === 0) return all
  const set = new Set(all)
  const ordered = savedOrder.filter((a) => set.delete(a))
  return ordered.concat(Array.from(set))
}

// eslint-disable-next-line no-unused-vars
const actions = {
  DO_NOTHING,
  allActions,
  getTitle,
  getOrderedActions,
  run,
}
