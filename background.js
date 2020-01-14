function sortAndMergeTabs() {
  chrome.windows.getCurrent(function (currentWindow) {
    chrome.windows.getAll({ "populate": true }, function (windows) {
      tabs = []
      windows.forEach(window => {
        if (window.type != "popup") {
          window.tabs.forEach(tab => {
            if (tab.pinned != true) {
              tabs.push(tab)
            }
          })
        }
      })
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
          { "windowId": currentWindow.id, "index": tabs.length * 2 });
      })
    });
  })
}

function closeTabsFromCurrentDomain() {
  chrome.tabs.getSelected(tab => {
    var url = new URL(tab.url)
    closeTabsFromDomain(url.host)
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

chrome.browserAction.onClicked.addListener(sortAndMergeTabs);

chrome.contextMenus.onClicked.addListener(event => {
  if (event.menuItemId == "close_tabs_from_this_domain") {
    closeTabsFromCurrentDomain()
  }
})

chrome.contextMenus.create({
  "title": "Close tabs from this domain",
  "id": "close_tabs_from_this_domain",
  contexts: ["browser_action"],
});
