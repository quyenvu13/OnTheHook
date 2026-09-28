# Security

## Semantic input boundary

Only the undertaking text and other-side label enter the validator prompt. Deterministic fields such as wallet addresses, sender, counters, state, and method consequences are excluded.

Reserved outcome labels and prompt markers are rejected at the write boundary. A fixed-point scrub runs again while the prompt is assembled so nested marker fragments cannot reconstruct a control token.

## Fail-safe behavior

Malformed, missing, unknown, or unclear validator output maps to EFFORT_OWED. This keeps the record open instead of allowing a potentially false result claim to close it.

Validator disagreement fails the transaction. A failed opening does not create a record.

## Authorization

- The author alone may claim discharge on a RESULT record.
- The named other side alone may rebut a claimed RESULT record.
- Both named sides may append to an EFFORT log.
- A RESULT record cannot receive log entries.
- An EFFORT record cannot receive a discharge claim or rebuttal.

Wallet addresses are pseudonymous identifiers. The contract does not prove that the two supplied wallets represent different people.

## Frontend boundary

- Contract strings are displayed as React text nodes. The app does not use unsafe HTML injection.
- Finalized reads and non-wallet RPC calls go through the same-origin proxy.
- The browser wallet receives only account, chain-switch, signing, and transaction methods.
- Opening performs a finalized-state duplicate read before submission.
- Success is shown only after the expected finalized post-state is read. A hash, FINALIZED label, or missing execution field alone is not treated as success.
- Rollback reasons are extracted recursively and displayed without executing returned content.

## Non-goals

The contract does not custody assets, verify real-world performance, authenticate legal identity, use time, or fetch external evidence.

Report security issues privately before public disclosure.
