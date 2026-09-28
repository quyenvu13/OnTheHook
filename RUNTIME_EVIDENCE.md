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

The Intelligent Contract submission’s transaction hashes are deliberately not reused. Every row below requires a new Project-address transaction plus finalized post-state.

| # | Role | Interaction | Expected proof | Status |
|---:|---|---|---|---|
| 1 | Wallet A | Open D3: The backlog will be cleared. | RESULT_OWED; RESULT; OPEN; new ID and tx | NOT RUN |
| 2 | Wallet A | Inspect RESULT method surface | Add log entry disabled with exact RESULT reason | NOT RUN |
| 3 | Wallet A | Claim discharge on D3 | SUCCESS; CLAIMED; Claim: 1 of 1; tx | NOT RUN |
| 4 | Wallet A | Open E3: The backlog will be worked on daily. | EFFORT_OWED; EFFORT; RUNNING; new ID and tx | NOT RUN |
| 5 | Wallet A then B | Inspect EFFORT shape; Wallet B adds log | Claim disabled with exact EFFORT reason; log attributed to B; RUNNING; tx | NOT RUN |
| 6 | Tester | Load D3 and E3 side by side | Screenshot shows closed pair versus no-end-state log | NOT RUN |

FINALIZED alone is insufficient. Each write is complete only when the leader execution result is SUCCESS and the expected finalized post-state is readable.
