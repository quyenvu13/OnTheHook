# Runtime evidence — OnTheHook Project

Network: GenLayer StudioNet, chain ID 61999, Normal Full Consensus.

Project contract: 0x3B7BEb7cB1FDfEeDa58B89a77a77853CfAbc7166

Deployment transaction: 0xed4664553ef2d8035deee20ba5c08755ba4c3bac414c6a4a07fb8ae8b3b1856e

Canonical source SHA-256: 41e8ed9e10d1486e003c9fcede2f94a1b7a3b9894924f54cac1ddec847e6543d

## Verified deployment baseline

| Check | Result |
|---|---|
| Contract address differs from the Intelligent Contract submission | PASS |
| Deployment transaction finalized | PASS |
| Leader execution result | SUCCESS |
| On-chain source equals packaged frozen source | PASS |
| Live contract identity | OutcomeOwed v1.0 |
| Live result states | OPEN, CLAIMED, SETTLED |
| Live effort state | RUNNING |
| Money / clock / external web / preview | all false |

## Project interaction ledger

The Intelligent Contract submission’s transaction hashes are deliberately not reused. These writes target the separate Project deployment.

Wallets:

- Wallet A / author: `0x923a09d0D6e5C242e36C3c1D2071835917cC0bDF`
- Wallet B / named other side: `0x188f15bC55302ff2d55f0107300499aed23a831E`

| # | Caller | Interaction | Finalized transaction | Execution / semantic proof | Latest-final post-state | Status |
|---:|---|---|---|---|---|---|
| 1 | Wallet A | Open “The backlog will be cleared.” for Wallet B / “the Client” | `0xbd20207f9bee68419f633db61f536cba6c3861120875ced07cfdc5372d20ce8e` | Leader `SUCCESS`; equivalence output `{"outcome":"RESULT_OWED"}` | ID `2524e0f7a877a53d1efeaf4cc58491dee0d5ea71c66135398c0c5a767c24452f`; RESULT | PASS |
| 2 | Wallet A | Claim discharge: “The backlog has been cleared.” | `0x573833d22cca5156b1121a286f7d0a0c71dedbf4f31c28538d98759592ac337f` | Leader `SUCCESS` | `CLAIMED`; claim note exact; rebuttal empty; log count 0 | PASS |
| 3 | Wallet A | Open “The backlog will be worked on daily.” for Wallet B / “the Client” | `0x30da340d8679dd815b3e90f8f1ecb2cbe7066fb9637fc1edf1abf7ed2f4361e8` | Leader `SUCCESS`; equivalence output `{"outcome":"EFFORT_OWED"}` | ID `88ddebfc95caf86104a2cb4547593d85b37db1a85aca055c7e5ac01395a3de8d`; EFFORT; `RUNNING` | PASS |
| 4 | Wallet B | Add log entry: “Daily work has started.” | `0x1bf73826689b5f76c09c0b50a221a17e99d510722142cd65adfe1794a5fee7ab` | Leader `SUCCESS` | `RUNNING`; log count 1; entry 1 attributed to Wallet B; no end state | PASS |
| 5 | Wallet B connected | Load both records side by side | Read-only latest-final reads | RESULT Add log disabled with `This undertaking is discharged by a claim, not by a log`; EFFORT Claim/Rebuttal disabled with `This is a standing obligation; add a log entry instead` | Closed pair and standing log displayed together | PASS |

## Final record snapshots

### RESULT record

- ID: `2524e0f7a877a53d1efeaf4cc58491dee0d5ea71c66135398c0c5a767c24452f`
- Author: Wallet A
- Other side: Wallet B, label `the Client`
- Text: `The backlog will be cleared.`
- Outcome / kind / state: `RESULT_OWED` / `RESULT` / `CLAIMED`
- Claim note: `The backlog has been cleared.`
- Claim / rebuttal: 1 of 1 / 0 of 1
- Log count: 0

### EFFORT record

- ID: `88ddebfc95caf86104a2cb4547593d85b37db1a85aca055c7e5ac01395a3de8d`
- Author: Wallet A
- Other side: Wallet B, label `the Client`
- Text: `The backlog will be worked on daily.`
- Outcome / kind / state: `EFFORT_OWED` / `EFFORT` / `RUNNING`
- Log count: 1
- Entry 1: `Daily work has started.` by Wallet B
- Terminal state: none

## Explorer links

- [Open RESULT transaction](https://explorer-studio.genlayer.com/tx/0xbd20207f9bee68419f633db61f536cba6c3861120875ced07cfdc5372d20ce8e)
- [Claim discharge transaction](https://explorer-studio.genlayer.com/tx/0x573833d22cca5156b1121a286f7d0a0c71dedbf4f31c28538d98759592ac337f)
- [Open EFFORT transaction](https://explorer-studio.genlayer.com/tx/0x30da340d8679dd815b3e90f8f1ecb2cbe7066fb9637fc1edf1abf7ed2f4361e8)
- [Wallet B log transaction](https://explorer-studio.genlayer.com/tx/0x1bf73826689b5f76c09c0b50a221a17e99d510722142cd65adfe1794a5fee7ab)

The evidence was re-read directly from StudioNet after finalization. `npm run verify:onchain` reproduces the deployment, receipt, semantic-output, caller, and post-state checks. FINALIZED alone was not treated as sufficient; every recorded write also has leader execution `SUCCESS` and the expected latest-final post-state.
