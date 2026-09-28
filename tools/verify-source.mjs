import crypto from 'node:crypto'
import fs from 'node:fs'

const sourceUrl = new URL('../contracts/OutcomeOwed.py', import.meta.url)
const hashUrl = new URL('../SOURCE_SHA256.txt', import.meta.url)

if (!fs.existsSync(hashUrl)) {
  console.error('SOURCE_SHA256.txt is absent until the StudioNet semantic gates pass and source is frozen.')
  process.exit(2)
}

function canonicalBytes(buffer) {
  let text = buffer.toString('utf8').replace(/\r\n/g, '\n')
  if (text.endsWith('\n')) text = text.slice(0, -1)
  return Buffer.from(text, 'utf8')
}

const expected = fs.readFileSync(hashUrl, 'utf8').trim().split(/\s+/)[0].toLowerCase()
const actual = crypto
  .createHash('sha256')
  .update(canonicalBytes(fs.readFileSync(sourceUrl)))
  .digest('hex')

if (!/^[a-f0-9]{64}$/.test(expected)) {
  console.error('SOURCE_SHA256.txt does not contain a valid SHA-256 digest')
  process.exit(1)
}
if (actual !== expected) {
  console.error(`source parity failure\nexpected ${expected}\nactual   ${actual}`)
  process.exit(1)
}
console.log(`PASS source SHA-256 ${actual}`)
