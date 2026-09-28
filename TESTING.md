# Testing status — OnTheHook Project

## ĐÃ TỰ CHẠY

- Frozen source gate: PASS — canonical SHA-256 41e8ed9e10d1486e003c9fcede2f94a1b7a3b9894924f54cac1ddec847e6543d.
- Project deployment parity: PASS — Studio-returned code at 0x3B7BEb7cB1FDfEeDa58B89a77a77853CfAbc7166 has the same canonical hash.
- Project deployment execution: PASS — transaction 0xed4664553ef2d8035deee20ba5c08755ba4c3bac414c6a4a07fb8ae8b3b1856e is finalized and its leader execution result is SUCCESS.
- Live latest-final read: PASS — get_limits returned OutcomeOwed v1.0, both semantic outcomes, RESULT states OPEN / CLAIMED / SETTLED, permanent EFFORT state RUNNING, and no money, web, clock, global admin, or preview endpoint.
- Kill-set gate: PASS — 10 cases, no separating token or bigram.
- Rubric overlap gate: PASS — zero shared content word with the 10 locked cases.
- Production-source state-machine suite: PASS — 22 tests.
- Browser-library suite: PASS — 24 tests covering Unicode ID parity, frozen vectors, receipt handling, rollback extraction, and React text escaping.
- Static Project gates: PASS — four-method UI, exact shape reasons, duplicate preflight, finalized reload, same-origin proxy, network switching, pinned SDK, single viem, and no unsafe HTML injection.
- GenVM linter: PASS — return code 0; four non-blocking view return-annotation warnings.
- Source API gate: PASS — v0.2 header, forbidden APIs, fail-safe branch, and four-method write surface.
- TypeScript and production build: PASS — npm run build return code 0.
- Full local command: PASS — npm test, npm run verify:source, and npm run build all returned code 0.
- Calldata probe on frozen source: PASS — all 10 locked cases previously passed eth_estimateGas on StudioNet; the new Project address was rechecked for D1, D2, and D3 before the network runner stopped.
- Remaining seven Project-address estimate calls: NOT RUN — the execution environment reached its network-tool limit after live source, deployment, limits, and three estimate checks had already passed. Their deterministic encoded bytes are unchanged, and this is not delegated to the user.

## CẦN NGƯỜI DÙNG CHẠY — 6 bước quan trọng

Use two wallets: Wallet A as author and Wallet B as the named other side. Save every successful transaction hash.

1. Deploy is already complete. Open the hosted dApp, connect Wallet A, and confirm it shows contract 0x3B7B…7166 on StudioNet 61999.
2. Open “The backlog will be cleared.” with Wallet B / label “the Client”. Expect RESULT_OWED, RESULT, OPEN. Save the tx and ID.
3. On that RESULT card, confirm Add log entry is disabled with “This undertaking is discharged by a claim, not by a log”; then submit Claim discharge from Wallet A. Expect CLAIMED and Claim: 1 of 1.
4. Open “The backlog will be worked on daily.” with the same two wallets. Expect EFFORT_OWED, EFFORT, RUNNING. Save the tx and ID.
5. On that EFFORT card, confirm Claim discharge is disabled with “This is a standing obligation; add a log entry instead”; switch to Wallet B and add one log. Expect the entry attributed to Wallet B and state still RUNNING.
6. Load the RESULT ID and EFFORT ID side by side. Capture one desktop screenshot showing both different shapes, both exact disabled reasons, Claim: 1 of 1, and Log: 1 entry, no end state. Also capture the transaction links if any result is delayed or errors.

Do not repeat a submitted action while confirmation is delayed. Use Explorer or Refresh until finalized state appears.

## What this run does NOT prove

The checks prove the packaged source, deterministic state machine, frontend safety and confirmation rules, separate Project deployment, and live deployment parity. They do not prove the six Project interactions until their new transaction hashes and post-states are recorded. They also do not prove real-world performance, legal identity, or that every future natural-language promise will receive the intended semantic outcome.
