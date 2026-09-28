/**
 * OutcomeOwed — StudioNet open_undertaking calldata probe.
 *
 * Usage after deployment:
 *   npm run probe:calldata
 *
 * This calls eth_estimateGas only. It proves payload reception, not GenVM
 * execution, semantic consensus, authorization, or post-state.
 */
import { abi } from 'genlayer-js'
import { encodeFunctionData, isAddress } from 'viem'

const RPC = process.env.STUDIO_RPC || 'https://studio.genlayer.com/api'
const CONTRACT = (
  process.env.CONTRACT
  || '0x3B7BEb7cB1FDfEeDa58B89a77a77853CfAbc7166'
).trim()
const FROM = process.env.FROM || '0x1111111111111111111111111111111111111111'
const OTHER = process.env.OTHER || '0x2222222222222222222222222222222222222222'
const LABEL = 'the Client'
const CONSENSUS = '0xb7278A61aa25c888815aFC32Ad3cC52fF24fE575'

const CASES = [
  ['D1', 'RESULT_OWED', 'We will use a dedicated team and the data will be fully migrated.'],
  ['D2', 'RESULT_OWED', 'We will deliver a signed audit certificate.'],
  ['D3', 'RESULT_OWED', 'The backlog will be cleared.'],
  ['D4', 'RESULT_OWED', 'We will apply every available method, and the licence will be approved.'],
  ['D5', 'RESULT_OWED', 'The site will be live on the new host.'],
  ['E1', 'EFFORT_OWED', 'We will use reasonable care in handling the data.'],
  ['E2', 'EFFORT_OWED', 'We will keep trying to reach the supplier.'],
  ['E3', 'EFFORT_OWED', 'The backlog will be worked on daily.'],
  ['E4', 'EFFORT_OWED', 'We will pursue the licence application diligently.'],
  ['E5', 'EFFORT_OWED', 'Best endeavours will be applied to the migration.'],
]

const ABI_V5 = [{
  type: 'function',
  name: 'addTransaction',
  stateMutability: 'nonpayable',
  inputs: [
    { name: '_sender', type: 'address' },
    { name: '_recipient', type: 'address' },
    { name: '_numOfInitialValidators', type: 'uint256' },
    { name: '_maxRotations', type: 'uint256' },
    { name: '_txData', type: 'bytes' },
  ],
  outputs: [],
}]

if (!isAddress(CONTRACT)) {
  console.error('CONTRACT must be the deployed OutcomeOwed address')
  process.exit(2)
}
if (!isAddress(FROM) || !isAddress(OTHER) || FROM.toLowerCase() === OTHER.toLowerCase()) {
  console.error('FROM and OTHER must be different valid EVM addresses')
  process.exit(2)
}

const payload = (method, args) => abi.transactions.serialize([
  abi.calldata.encode({ method, args }),
  false,
])
const byteLength = (hex) => (hex.length - 2) / 2

async function rpc(method, params) {
  const response = await fetch(RPC, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
  })
  return response.json().catch(() => ({ error: { message: `HTTP ${response.status}` } }))
}

console.log(`RPC      ${RPC}`)
console.log(`contract ${CONTRACT}`)
console.log('case expected       textB innerB outerB estimate')
let failures = 0

for (const [name, expected, text] of CASES) {
  const txPayload = payload('open_undertaking', [OTHER, LABEL, text])
  const envelope = encodeFunctionData({
    abi: ABI_V5,
    functionName: 'addTransaction',
    args: [FROM, CONTRACT, 5n, 3n, txPayload],
  })
  const result = await rpc('eth_estimateGas', [{
    from: FROM,
    to: CONSENSUS,
    data: envelope,
    value: '0x0',
  }])
  const status = result?.error ? 'FAIL' : 'OK'
  if (result?.error) failures += 1
  console.log(
    `${name.padEnd(4)} ${expected.padEnd(15)} `
    + `${String(Buffer.byteLength(text, 'utf8')).padStart(5)} `
    + `${String(byteLength(txPayload)).padStart(6)} `
    + `${String(byteLength(envelope)).padStart(6)} ${status}`,
  )
  if (result?.error) console.log(`     ${result.error.code ?? ''} ${result.error.message ?? ''}`)
}

console.log('\nPayload reception only; accepted writes and post-state remain mandatory.')
if (failures > 0) process.exit(1)
