# Testing status — OnTheHook Project

## Completed local and deployment checks

- Frozen source gate: PASS — canonical SHA-256 `41e8ed9e10d1486e003c9fcede2f94a1b7a3b9894924f54cac1ddec847e6543d`.
- Project deployment parity: PASS — Studio-returned code at `0x3B7BEb7cB1FDfEeDa58B89a77a77853CfAbc7166` has the same canonical hash.
- Project deployment execution: PASS — transaction `0xed4664553ef2d8035deee20ba5c08755ba4c3bac414c6a4a07fb8ae8b3b1856e` is FINALIZED with leader execution `SUCCESS`.
- Live latest-final limits read: PASS — OutcomeOwed v1.0, semantic outcomes `RESULT_OWED` / `EFFORT_OWED`, RESULT states `OPEN` / `CLAIMED` / `SETTLED`, permanent EFFORT state `RUNNING`, and no money, web, clock, global admin, or preview endpoint.
- Kill-set gate: PASS — 10 cases, no separating token or bigram.
- Rubric overlap gate: PASS — zero shared content words with the 10 locked cases.
- Production-source state-machine suite: PASS — 22 tests.
- Browser-library suite: PASS — 26 tests covering Unicode ID parity, frozen vectors, receipt handling, nested Base64 read reverts, split wallet/RPC routing, and React text escaping.
- Static Project gates: PASS — four-method UI, exact shape reasons, duplicate preflight, finalized reload, same-origin proxy, network switching, pinned SDK, single viem, and no unsafe HTML injection.
- GenVM linter: PASS — return code 0; four non-blocking view return-annotation warnings.
- Source API gate: PASS — v0.2 header, forbidden APIs, fail-safe branch, and four-method write surface.
- TypeScript and production build: PASS — return code 0.
- Clean-package `npm ci && npm run check`: PASS.

## Completed Project runtime proof

Network: GenLayer StudioNet 61999, Normal Full Consensus.

- Wallet A / author: `0x923a09d0D6e5C242e36C3c1D2071835917cC0bDF`
- Wallet B / named other side: `0x188f15bC55302ff2d55f0107300499aed23a831E`

| Action | Finalized transaction | Execution / semantic result | Verified post-state |
|---|---|---|---|
| Open “The backlog will be cleared.” | `0xbd20207f9bee68419f633db61f536cba6c3861120875ced07cfdc5372d20ce8e` | Leader `SUCCESS`; `RESULT_OWED` | RESULT ID `2524e0…24452f`, initially `OPEN` |
| Claim discharge: “The backlog has been cleared.” | `0x573833d22cca5156b1121a286f7d0a0c71dedbf4f31c28538d98759592ac337f` | Leader `SUCCESS` | `CLAIMED`; Claim 1 of 1; no log |
| Open “The backlog will be worked on daily.” | `0x30da340d8679dd815b3e90f8f1ecb2cbe7066fb9637fc1edf1abf7ed2f4361e8` | Leader `SUCCESS`; `EFFORT_OWED` | EFFORT ID `88ddeb…de8d`, `RUNNING` |
| Wallet B adds “Daily work has started.” | `0x1bf73826689b5f76c09c0b50a221a17e99d510722142cd65adfe1794a5fee7ab` | Leader `SUCCESS` | `RUNNING`; log 1 attributed to Wallet B; no end state |

Direct latest-final reads after all four writes confirmed the full IDs, both wallet roles, exact text and notes, outcome/kind, counters, and states. The hosted UI then loaded both records side by side and displayed the contract-specific disabled-method reasons.

Run the reproducible network verifier with:

    npm run verify:onchain

It fails unless deployment parity, all four finalized receipts, both semantic outcomes, the callers, and both latest-final post-states match this evidence.

## Read-only reviewer path — 4 steps

1. Open the hosted dApp from the submission Website link. Confirm StudioNet `61999` and contract `0x3B7B…7166`.
2. Load RESULT ID `2524e0f7a877a53d1efeaf4cc58491dee0d5ea71c66135398c0c5a767c24452f` in the first slot.
3. Load EFFORT ID `88ddebfc95caf86104a2cb4547593d85b37db1a85aca055c7e5ac01395a3de8d` in the second slot.
4. Verify the RESULT card is `CLAIMED` with Claim 1 of 1, while the EFFORT card remains `RUNNING` with Wallet B’s one log entry and no end state. Confirm each card disables the other shape’s methods with its exact reason.

No wallet or new transaction is required for this review path.

## Evidence boundary

The checks prove the packaged source, deterministic state machine, separate Project deployment, on-chain source parity, the two semantic classifications, role-separated writes, and finalized post-state for these exact records. They do not prove real-world performance, legal identity, or that every future natural-language promise will receive the intended semantic outcome.
