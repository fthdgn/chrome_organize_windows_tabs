/**
 * @typedef {Object} Options
 * @property {string} defaultAction
 * @property {boolean} ignorePinnedTabs
 * @property {boolean} ignorePopupWindows
 * @property {boolean} ignoreAppWindows
 * @property {boolean} showDefaultActionPopup
 * @property {string} colorCode
 * @property {string} sortDirection
 * @property {string} sortMode
 * @property {string[]} actionOrder
 */

/**
 * @returns {Promise<Options>}
 */
async function getOptions() {
  return await chrome.storage.sync.get({
    defaultAction: actions.allActions[0],
    ignorePinnedTabs: true,
    ignorePopupWindows: true,
    ignoreAppWindows: true,
    showDefaultActionPopup: true,
    colorCode: "",
    sortDirection: "desc",
    sortMode: "url",
    actionOrder: [],
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
