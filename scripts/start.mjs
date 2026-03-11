import { spawn } from "node:child_process"
import { resolve } from "node:path"
import {
  install,
  resolveBuildId,
  computeExecutablePath,
  detectBrowserPlatform,
  Browser,
  ChromeReleaseChannel,
} from "@puppeteer/browsers"

const extensionPath = resolve(import.meta.dirname, "..")
const cacheDir = resolve(import.meta.dirname, "..", ".cache", "browsers")
const platform = detectBrowserPlatform()

const buildId = await resolveBuildId(Browser.CHROME, platform, ChromeReleaseChannel.STABLE)

console.log(`Ensuring Chrome ${buildId} is available...`)

await install({
  browser: Browser.CHROME,
  buildId,
  cacheDir,
})

const chromePath = computeExecutablePath({
  browser: Browser.CHROME,
  buildId,
  cacheDir,
})

const args = [`--load-extension=${extensionPath}`, "--new-window", "about:blank"]

console.log(`Launching Chrome with extension from ${extensionPath}`)

const child = spawn(chromePath, args, { detached: true, stdio: "ignore" })
child.unref()
