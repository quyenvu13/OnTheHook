import fs from 'node:fs'

const path = new URL('../contracts/OutcomeOwed.py', import.meta.url)
const source = fs.readFileSync(path, 'utf8').replace(/\r\n/g, '\n')
const lines = source.split('\n')

const expected = [
  '# v0.2.16',
  '# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }',
  '',
  'from genlayer import *',
]

const failures = []
for (let index = 0; index < expected.length; index += 1) {
  if (lines[index] !== expected[index]) failures.push(`header line ${index + 1} differs`)
}

for (const token of [
  'import genlayer as gl',
  'gl.contract.Contract',
  'gl.vm.run_nondet(',
  'gl.message.raw',
  'time.time(',
  'datetime.now(',
  'gl.nondet.web.render',
  'emit_transfer',
  'payable',
  'gl.evm',
]) {
  if (source.includes(token)) failures.push(`forbidden source token: ${token}`)
}

for (const prefix of ['preview_', 'classify_', 'dry_run_']) {
  if (new RegExp(`def\\s+${prefix}`).test(source)) {
    failures.push(`forbidden public helper prefix: ${prefix}`)
  }
}

const writes = [...source.matchAll(/@gl\.public\.write\s+def\s+(\w+)/g)].map((match) => match[1])
const expectedWrites = ['open_undertaking', 'claim_discharge', 'rebut', 'log_entry']
if (JSON.stringify(writes) !== JSON.stringify(expectedWrites)) {
  failures.push(`write surface differs: ${JSON.stringify(writes)}`)
}

if (!source.includes('return {"outcome": EFFORT_OWED}')) {
  failures.push('fail-safe branch is not EFFORT_OWED')
}

if (failures.length > 0) {
  for (const failure of failures) console.error(`FAIL ${failure}`)
  process.exit(1)
}

console.log('PASS source header, forbidden APIs, fail-safe, and four-method write surface')
