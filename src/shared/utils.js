/**
 * @param {number[]} arr
 * @returns {arr is [number, ...number[]]}
 */
function isNonEmptyArray(arr) {
  return arr.length > 0
}

function localizeHtml() {
  for (const element of document.querySelectorAll("[data-i18n]")) {
    const key = element.getAttribute("data-i18n")
    if (key) {
      element.textContent = chrome.i18n.getMessage(key)
    }
  }
}

// eslint-disable-next-line no-unused-vars
const utils = {
  isNonEmptyArray,
  localizeHtml,
}
