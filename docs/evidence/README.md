# Evidence

LOCAL_CHECKS.txt records reproducible offline results.

PROJECT_DEPLOYMENT_EVIDENCE.md at the repository root records the separate Project deployment, transaction, live contract identity, and source parity.

RUNTIME_EVIDENCE.md is the authoritative ledger for Project-address writes. It records four finalized transactions with leader `SUCCESS`, both semantic outputs, role-separated callers, and the latest-final RESULT and EFFORT records.

Run `npm run verify:onchain` to reproduce the deployment parity, interaction receipt, semantic-output, caller, and post-state checks.
