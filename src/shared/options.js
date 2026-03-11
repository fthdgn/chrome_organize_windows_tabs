/**
 * @typedef {Object} Options
 * @property {Action} defaultAction
 * @property {boolean} ignorePinnedTabs
 * @property {boolean} ignorePopupWindows
 * @property {boolean} ignoreAppWindows
 * @property {boolean} showDefaultActionPopup
 */

/**
 * @returns {Promise<Options>}
 */
async function getOptions() {
  return await chrome.storage.sync.get({
    defaultAction: actions.Action.MERGE_AND_SORT,
    ignorePinnedTabs: true,
    ignorePopupWindows: true,
    ignoreAppWindows: true,
    showDefaultActionPopup: true,
  })
}

/**
 * @param {Partial<Options>} values
 * @returns {Promise<void>}
 */
async function setOptions(values) {
  await chrome.storage.sync.set(values)
}

// eslint-disable-next-line no-unused-vars
const options = {
  get: getOptions,
  set: setOptions,
}
