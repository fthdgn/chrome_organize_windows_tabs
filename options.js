const defaultActionInput = document.getElementById("defaultActionInput")
const ignorePinnedTabsInput = document.getElementById("ignorePinnedTabsInput")
const ignorePopupWindowsInput = document.getElementById("ignorePopupWindowsInput")
const ignoreAppWindowsInput = document.getElementById("ignoreAppWindowsInput")

ALL_ACTIONS.forEach(action => {
    var opt = document.createElement("option");
    opt.value = action.id;
    opt.innerHTML = action.title;
    defaultActionInput.appendChild(opt);
})

getOptions().then(options => {
    defaultActionInput.value = options.defaultAction
    ignorePinnedTabsInput.checked = options.ignorePinnedTabs
    ignorePopupWindowsInput.checked = options.ignorePopupWindows
    ignoreAppWindowsInput.checked = options.ignoreAppWindows
})

defaultActionInput.addEventListener('change', () => {
    chrome.storage.sync.set({ defaultAction: defaultActionInput.value })
});

ignorePinnedTabsInput.addEventListener('change', () => {
    chrome.storage.sync.set({ ignorePinnedTabs: ignorePinnedTabsInput.checked })
});

ignorePopupWindowsInput.addEventListener('change', () => {
    chrome.storage.sync.set({ ignorePopupWindows: ignorePopupWindowsInput.checked })
});

ignoreAppWindowsInput.addEventListener('change', () => {
    chrome.storage.sync.set({ ignoreAppWindows: ignoreAppWindowsInput.checked })
});
