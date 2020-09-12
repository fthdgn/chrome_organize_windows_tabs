const defaultActionInput = document.getElementById("defaultActionInput")
const ignorePinnedTabsInput = document.getElementById("ignorePinnedTabsInput")
const ignorePopupWindowsInput = document.getElementById("ignorePopupWindowsInput")

ALL_ACTIONS.forEach(action => {
    var opt = document.createElement("option");
    opt.value = action.id;
    opt.innerHTML = action.title;
    defaultActionInput.appendChild(opt);
})

chrome.storage.sync.get({ defaultAction: MERGE_AND_SORT_ACTION.id, ignorePinnedTabs: true, ignorePopupWindows: true }, result => {
    defaultActionInput.value = result.defaultAction
    ignorePinnedTabsInput.checked = result.ignorePinnedTabs
    ignorePopupWindowsInput.checked = result.ignorePopupWindows
})

defaultActionInput.addEventListener('change', (event) => {
    chrome.storage.sync.set({ defaultAction: defaultActionInput.value })
});

ignorePinnedTabsInput.addEventListener('change', (event) => {
    chrome.storage.sync.set({ ignorePinnedTabs: ignorePinnedTabsInput.checked })
});

ignorePopupWindowsInput.addEventListener('change', (event) => {
    chrome.storage.sync.set({ ignorePopupWindows: ignorePopupWindowsInput.checked })
});
