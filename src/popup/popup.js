const okButton = /** @type {HTMLElement} */ (document.getElementById("okButton"))

const cancelButton = /** @type {HTMLElement} */ (document.getElementById("cancelButton"))

const dontAskAgainInput = /** @type {HTMLInputElement} */ (document.getElementById("dontAskAgainInput"))

const defaultActionSpan = /** @type {HTMLElement} */ (document.getElementById("defaultActionSpan"))

const optionsLink = /** @type {HTMLElement} */ (document.getElementById("optionsLink"))

utils.localizeHtml()

void options.get().then((opts) => {
  const title = actions.getTitle(opts.defaultAction)
  if (title) {
    defaultActionSpan.textContent = title
  }
})

okButton.onclick = async () => {
  await options.set({
    showDefaultActionPopup: !dontAskAgainInput.checked,
  })

  const opts = await options.get()
  await actions.run(opts.defaultAction)

  if (dontAskAgainInput.checked) {
    await chrome.action.setPopup({ popup: "" })
  }

  window.close()
}

cancelButton.onclick = () => {
  window.close()
}

optionsLink.onclick = () => {
  void chrome.runtime.openOptionsPage()
}
