OnTheHook does not ask whether a promise can fail, and it does not grade a promise on a scale. Both kinds of promise here are binding and both can fail. It asks what the author is on the hook for — an end state, or the way it works — and it gives each answer a different shape of record.

# OnTheHook

OnTheHook is a GenLayer StudioNet dApp for turning one semantic verdict into one of two deterministic on-chain record shapes.

- RESULT_OWED creates a closed pair: one discharge claim from the author and one rebuttal from the named other side.
- EFFORT_OWED creates a two-sided standing log: both named wallets may append entries, and the record never gains a completed state.

The contract does not hold money. It records claims, rebuttals, and attributed log entries; it does not enforce an off-chain agreement.

## Why GenLayer

The load-bearing question is semantic rather than lexical: does the text bind its author to an end state, or only to the manner of its own conduct?

The pair “The backlog will be cleared” and “The backlog will be worked on daily” shares a subject and passive construction but requires opposite record shapes. Likewise, a sentence may contain effort language and still promise a result. Validator consensus answers that narrow question once. All later permissions and transitions are deterministic.

## Live Project deployment

| Field | Value |
|---|---|
| Network | GenLayer StudioNet, chain ID 61999 |
| Contract | 0x3B7BEb7cB1FDfEeDa58B89a77a77853CfAbc7166 |
| Deploy transaction | 0xed4664553ef2d8035deee20ba5c08755ba4c3bac414c6a4a07fb8ae8b3b1856e |
| Canonical source SHA-256 | 41e8ed9e10d1486e003c9fcede2f94a1b7a3b9894924f54cac1ddec847e6543d |
| Contract source | contracts/OutcomeOwed.py |

The packaged source and Studio-returned source have the same canonical SHA-256. Line endings are normalized only for the parity calculation.

## How to try it

Use two StudioNet wallets to exercise both named sides. Each tester should open fresh records; the path does not depend on shared demo state.

1. Open the dApp, connect Wallet A, and stay on StudioNet 61999.
2. In Open, enter Wallet B, label it “the Client”, and submit: “The backlog will be cleared.”
3. Load the resulting ID. Confirm RESULT, OPEN, the Claim / Rebuttal pair, and the disabled Add log entry method with its exact contract reason.
4. As Wallet A, claim discharge. Confirm Claim: 1 of 1 and state CLAIMED.
5. As Wallet A, open: “The backlog will be worked on daily.” Confirm EFFORT, RUNNING, no completed state, and the disabled Claim discharge method with its exact contract reason.
6. Switch to Wallet B and add a log entry. Confirm the entry displays Wallet B and the count reads Log: 1 entry, no end state.

The UI derives each undertaking ID locally with Python-compatible whitespace and code-point rules. It probes finalized state before opening, so an existing ID is blocked before a transaction is sent.

## Interface guarantees

- Every loaded record shows all four actions: Open another, Claim discharge, Rebut claim, and Add log entry.
- Methods outside the selected shape stay visible but disabled with the contract’s exact reason.
- Contract text is rendered only through React text nodes; no unsafe HTML rendering is used.
- Reads and non-wallet RPC calls use the same-origin /genlayer-rpc proxy.
- MetaMask is used only for account access, chain switching, signing, and transaction submission. No wallet Snap is required.
- A submitted hash is not reported as success until the expected finalized post-state is readable.

## Local verification

Requirements: Node.js 22 or newer and Python 3.12.

    python3 -m pip install -r requirements-dev.txt
    npm ci
    npm run check
    python3 -m genvm_linter.cli lint contracts/OutcomeOwed.py
    npm run verify:onchain

The networked verifier checks the Project address, finalized deploy execution, live get_limits response, and on-chain source hash. The offline check runs the production-source state-machine suite, Unicode ID parity, receipt handling, HTML escaping, frontend static gates, source parity, typecheck, and production build.

## Architecture

- contracts/OutcomeOwed.py — frozen GenLayer v0.2 contract.
- src/lib/genlayer.ts — finalized reads, wallet transport, writes, duplicate preflight, and receipt handling.
- src/lib/id.js — Python-compatible normalization, code-point length, and Keccak-256 ID derivation.
- src/App.tsx — real record comparison, action surface, creation flow, and protocol proof.
- api/rpc.js — same-origin Vercel RPC proxy.
- tests — executable contract, ID, receipt, and rendering tests.

## Honest limitations

1. The contract does not hold funds or enforce anything outside the chain. It only selects a record shape and controls who may write each field.
2. A discharge claim and a log entry are self-reports. Their value is the forced shape, permanent attribution, and the counterparty’s available rebuttal or log access.
3. A false RESULT_OWED verdict is the principal risk because a standing obligation could be sealed by one claim. The classifier fails toward EFFORT_OWED, and RESULT records reserve one rebuttal for the other side.
4. A false EFFORT_OWED verdict leaves the record permanently open even after real-world work is complete. That cost intentionally falls on the author of ambiguous text.
5. The author supplies the other-side wallet. The contract blocks the author’s own address but cannot prove that two wallets belong to two different people.
6. EFFORT records accept at most 30 log entries. Reaching the storage cap does not close the record; it only stops new entries.
7. StudioNet transport was measured with the locked semantic cases. The UI warns and blocks payloads beyond its tested 255-byte serialized-call envelope even though the contract’s text cap is larger.

## Further evidence

- TESTING.md records exact local gate results and the remaining six-step browser proof.
- RUNTIME_EVIDENCE.md separates verified deployment facts from Project interactions that have not yet been run.
- PROJECT_DEPLOYMENT_EVIDENCE.md records source parity and deploy execution.
- LOCKED_SPEC.md describes the semantic boundary and deterministic consequences.

## License

MIT. See LICENSE.
