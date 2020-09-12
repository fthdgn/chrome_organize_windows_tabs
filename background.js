
const MERGE_AND_SORT_ACTION = {
  title: "Merge windows and sort tabs",
  id: "merge_and_sort"
}

const MERGE_ACTION = {
  title: "Merge windows",
  id: "merge"
}

const SORT_ACTION = {
  title: "Sort tabs",
  id: "sort"
}

const CLOSE_TABS_FROM_THIS_DOMAIN_ACTION = {
  title: "Close tabs from this domain",
  id: "close_tabs_from_this_domain"
}

const MOVE_TABS_FROM_THIS_DOMAIN_ACTION = {
  title: "Move tabs from this domain to this window",
  id: "move_tabs_from_this_domain"
}

const ALL_ACTIONS = [MERGE_AND_SORT_ACTION, MERGE_ACTION, SORT_ACTION, CLOSE_TABS_FROM_THIS_DOMAIN_ACTION, MOVE_TABS_FROM_THIS_DOMAIN_ACTION]

function getSelectedTab() {
  return new Promise(function (resolve, reject) {
    chrome.tabs.getSelected(tab => {
      resolve(tab)
    })
  })
}

function getCurrentWindow() {
  return new Promise(function (resolve, reject) {
    chrome.windows.getCurrent({ "populate": true }, function (currentWindow) {
      resolve(currentWindow)
    })
  })
}

function getOptions() {
  return new Promise(function (resolve, reject) {
    chrome.storage.sync.get({
      ignorePinnedTabs: true,
      ignorePopupWindows: true,
    }, storage => {
      resolve(storage)
    })
  })
}

function getAllWindows() {
  return new Promise(function (resolve, reject) {
    chrome.windows.getAll({ "populate": true }, function (windows) {
      resolve(windows)
    })
  })
}

function getTabsOfWindow(window, options) {
  if (options.ignorePopupWindows && window.type == "popup") {
    return []
  }
  return window.tabs.filter(tab => { return !options.ignorePinnedTabs || !tab.pinned })
}

function getTabsOfWindows(windows, options) {
  let tabs = []
  windows.forEach(window => {
    getTabsOfWindow(window, options).forEach(tab => {
      tabs.push(tab)
    })
  })
  return tabs
}

async function getAllTabs() {
  let options = await getOptions()
  let windows = await getAllWindows()
  return await getTabsOfWindows(windows, options)
}

async function getCurrentWindowTabs() {
  let options = await getOptions()
  let currentWindow = await getCurrentWindow()
  return getTabsOfWindow(currentWindow, options)
}

function baseAction(actionId) {
  if (actionId == MERGE_AND_SORT_ACTION.id) {
    mergeWindowsAndSortTabsAction()
  } else if (actionId == MERGE_ACTION.id) {
    mergeWindowsAction()
  } else if (actionId == SORT_ACTION.id) {
    sortTabsAction()
  } else if (actionId == CLOSE_TABS_FROM_THIS_DOMAIN_ACTION.id) {
    closeTabsFromCurrentDomainAction()
  } else if (actionId == MOVE_TABS_FROM_THIS_DOMAIN_ACTION.id) {
    moveTabsFromCurrentDomainAction()
  }
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
  let selectedTab = await getSelectedTab()
  let domain = new URL(selectedTab.url).host
  let tabs = await getAllTabs()
  tabs = tabs.filter(tab => { return new URL(tab.url).host == domain })
  tabs.forEach(tab => {
    chrome.tabs.remove(tab.id)
  })
}

async function moveTabsFromCurrentDomainAction() {
  let currentWindow = await getCurrentWindow()
  let selectedTab = await getSelectedTab()
  let domain = new URL(selectedTab.url).host
  let tabs = await getAllTabs()
  tabs = tabs.filter(tab => { return new URL(tab.url).host == domain })
  tabs.forEach(tab => {
    chrome.tabs.move(tab.id, { "windowId": currentWindow.id, "index": currentWindow.tabs.length + tabs.length })
    if (tab.pinned == true) {
      chrome.tabs.update(tab.id, { "pinned": true })
    }
  })
}

async function mergeWindows() {
  let currentWindow = await getCurrentWindow()
  let tabs = await getAllTabs()

  tabs.forEach(tab => {
    chrome.tabs.move(tab.id, { "windowId": currentWindow.id, "index": tabs.length * 2 })
    if (tab.pinned == true) {
      chrome.tabs.update(tab.id, { "pinned": true })
    }
  })
}

async function sortTabs() {
  let currentWindow = await getCurrentWindow()
  let tabs = await getCurrentWindowTabs()
  tabs.sort(function (a, b) {
    if (a.url < b.url) {
      return -1
    } else if (a.url > b.url) {
      return 1
    } else {
      return 0
    }
  })
  tabs.forEach(tab => {
    chrome.tabs.move(tab.id,
      { "windowId": currentWindow.id, "index": tabs.length * 2 })
    if (tab.pinned == true) {
      chrome.tabs.update(tab.id, { "pinned": true })
    }
  })
}

chrome.contextMenus.onClicked.addListener(event => {
  baseAction(event.menuItemId)
});

chrome.browserAction.onClicked.addListener(event => {
  chrome.storage.sync.get({ defaultAction: MERGE_AND_SORT_ACTION.id }, result => {
    baseAction(result.defaultAction)
  })
})

ALL_ACTIONS.forEach(item => {
  chrome.contextMenus.create({
    "title": item.title,
    "id": item.id,
    contexts: ["browser_action"],
  });
})
