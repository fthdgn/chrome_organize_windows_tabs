const okButton = document.getElementById("okButton")
const dontAskAgainInput = document.getElementById("dontAskAgainInput")
const defaultActionSpan = document.getElementById("defaultActionSpan")

getOptions().then(options => {
    let action = ALL_ACTIONS.find(action => action.id == options.defaultAction)
    defaultActionSpan.innerHTML = action.title.toLowerCase()
})


okButton.onclick = async () => {
    await chrome.storage.sync.set({ showDefaultActionPopup: !dontAskAgainInput.checked })

    let options = await getOptions()
    baseAction(options.defaultAction)

    if (dontAskAgainInput.checked) {
        chrome.action.setPopup({ popup: "" })
    }
}
