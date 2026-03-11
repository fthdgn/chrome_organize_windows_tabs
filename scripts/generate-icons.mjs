import { readFile, writeFile } from "fs/promises"
import { join, dirname } from "path"
import { fileURLToPath } from "url"
import { Resvg } from "@resvg/resvg-js"

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootDir = join(__dirname, "..")
const sizes = [16, 32, 48, 128]

const svgSource = await readFile(join(rootDir, "icons", "icon.svg"), "utf-8")

for (const size of sizes) {
  const resvg = new Resvg(svgSource, { fitTo: { mode: "width", value: size } })
  const png = resvg.render().asPng()
  const outPath = join(rootDir, "icons", `${size}.png`)
  await writeFile(outPath, png)
  console.log(`Generated icons/${size}.png`)
}
