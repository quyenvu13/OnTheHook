# Changelog

## 1.0.1 — 2026-09-28

- Decoded nested Base64 GenLayer read reverts so a missing undertaking is handled as an empty preflight result instead of a generic RPC error.
- Split write preparation between same-origin chain RPC reads and wallet-only signing/submission methods.
- Added regression coverage for the live missing-record receipt shape and nonce/gas transport routing.
- Recorded the completed Project runtime path: RESULT classification and claim, EFFORT classification, and Wallet B log entry.
- Extended the network verifier to check all four finalized interaction receipts, semantic outputs, callers, and latest-final post-state.

## 1.0.0 — 2026-09-28

- Published OnTheHook around the frozen OutcomeOwed v1.0 contract.
- Added side-by-side live record comparison without seeded data.
- Added distinct RESULT claim/rebuttal and EFFORT two-sided-log renderers.
- Kept all four write actions visible with exact disabled-method explanations.
- Added local Python-compatible ID derivation and duplicate preflight.
- Added finalized-state polling, execution receipt parsing, and rollback extraction.
- Added same-origin StudioNet RPC proxy for development and Vercel.
- Added production-source, Unicode parity, receipt, HTML escaping, source parity, static UI, and build gates.
- Recorded the separate Project deployment, deploy transaction, and canonical source parity.
