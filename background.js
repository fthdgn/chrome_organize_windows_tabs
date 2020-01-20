
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

const ALL_ACTIONS = [MERGE_AND_SORT_ACTION, MERGE_ACTION, SORT_ACTION, CLOSE_TABS_FROM_THIS_DOMAIN_ACTION]

function baseAction(actionId, ignorePinnedTabs) {
  if (actionId == MERGE_AND_SORT_ACTION.id) {
    mergeWindowsAndSortTabsAction(ignorePinnedTabs)
  } else if (actionId == MERGE_ACTION.id) {
    mergeWindowsAction(ignorePinnedTabs)
  } else if (actionId == SORT_ACTION.id) {
    sortTabsAction(ignorePinnedTabs)
  } else if (actionId == CLOSE_TABS_FROM_THIS_DOMAIN_ACTION.id) {
    closeTabsFromCurrentDomainAction()
  }
}

function mergeWindowsAndSortTabsAction(ignorePinnedTabs) {
  mergeWindows(ignorePinnedTabs, _ => {
    sortTabs(ignorePinnedTabs)
  })
}

function mergeWindowsAction(ignorePinnedTabs) {
  mergeWindows(ignorePinnedTabs, _ => { })
}

function sortTabsAction(ignorePinnedTabs) {
  sortTabs(ignorePinnedTabs)
}

function closeTabsFromCurrentDomainAction() {
  chrome.tabs.getSelected(tab => {
    var url = new URL(tab.url)
    closeTabsFromDomain(url.host)
  })
}

function mergeWindows(ignorePinnedTabs, callback) {
  chrome.windows.getCurrent({ "populate": true }, function (currentWindow) {
    chrome.windows.getAll({ "populate": true }, function (windows) {
      tabs = []
      windows.forEach(window => {
        if (window.type != "popup") {
          window.tabs.forEach(tab => {
            if (ignorePinnedTabs == false || tab.pinned != true) {
              tabs.push(tab)
            }
          })
        }
      })
      tabs.forEach(tab => {
        chrome.tabs.move(tab.id,
          { "windowId": currentWindow.id, "index": tabs.length * 2 })
        if (tab.pinned == true) {
          chrome.tabs.update(tab.id, { "pinned": true })
        }
      })
      callback()
    })
  })
}

function sortTabs(ignorePinnedTabs) {
  chrome.windows.getCurrent({ "populate": true }, function (currentWindow) {
    var tabs = currentWindow.tabs
    if (ignorePinnedTabs) {
      tabs = tabs.filter(tab => { return !tab.pinned })
    }
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
  })
}

function closeTabsFromDomain(domain) {
  chrome.windows.getAll({ "populate": true }, function (windows) {
    tabs = []
    windows.forEach(window => {
      if (window.type != "popup") {
        window.tabs.forEach(tab => {
          if (tab.pinned != true) {
            var url = new URL(tab.url)
            if (url.host == domain) {
              chrome.tabs.remove(tab.id)
            }
          }
        })
      }
    })
  });
}

chrome.contextMenus.onClicked.addListener(event => {
  chrome.storage.sync.get({ ignorePinnedTabs: true }, result => {
    baseAction(event.menuItemId, result.ignorePinnedTabs)
  })
});

chrome.browserAction.onClicked.addListener(event => {
  chrome.storage.sync.get({ defaultAction: MERGE_AND_SORT_ACTION.id, ignorePinnedTabs: true }, result => {
    baseAction(result.defaultAction, result.ignorePinnedTabs)
  })
})

ALL_ACTIONS.forEach(item => {
  chrome.contextMenus.create({
    "title": item.title,
    "id": item.id,
    contexts: ["browser_action"],
  });
})
