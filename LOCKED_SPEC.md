# Locked specification

## Semantic boundary

The contract asks one question about one author-written text: is the author bound to a particular end state, or only to the manner of its own conduct?

The two outcomes are RESULT_OWED and EFFORT_OWED. Both represent binding promises and both may fail. They are disjoint record types, not points on a scale.

## Record shapes

### RESULT

- Initial state: OPEN.
- The author may call claim_discharge exactly once, moving the record to CLAIMED.
- The named other side may call rebut exactly once after a claim, moving the record to SETTLED.
- log_entry is permanently unavailable and reverts with: This undertaking is discharged by a claim, not by a log.

### EFFORT

- Permanent state: RUNNING.
- The author and named other side may both append log entries.
- claim_discharge and rebut are permanently unavailable and revert with: This is a standing obligation; add a log entry instead.
- No method can create a completed state.

These opposite method restrictions are one paired consequence. The verdict changes the structure of the record rather than merely decorating it with a label.

## Classification

Only open_undertaking invokes semantic validator consensus. The tagged other-side label and undertaking text are the only semantic inputs. Wallets, sender, state, counters, permissions, and consequences never enter the classification prompt.

Malformed, unknown, or unclear output resolves to EFFORT_OWED. This is fail-safe because it prevents an uncertain standing obligation from being sealed by a single result claim. The ambiguous author bears the cost of a record that remains open.

Leader and validator disagreement causes the transaction to fail. Validator re-execution does not replace the input fence; both the reserved-token gate and fixed-point token removal remain required.

There is no preview, classify, or dry-run public endpoint. A free preview would permit repeated wording changes before committing.

## Immutable identity

The ID payload is:

    OUTCOME_OWED:UNDERTAKING:V1|lowercase_author|normalized_length|normalized_text

Text identity uses Python split semantics: leading and trailing whitespace is removed, every internal Python whitespace run is collapsed to one space, length counts Unicode code points, and Keccak-256 produces the 64-character ID. The stored text preserves internal whitespace after outer stripping.

The same author cannot reopen an equivalent whitespace-normalized text. The other-side wallet and label do not alter identity.

## Deterministic controls

- The other-side wallet is lowercased, must be a nonzero 42-character hex address, and cannot equal the sender.
- kind is assigned once and no method can change it.
- Claims, rebuttals, notes, writers, and counters are append-only or one-time fields.
- Log counters are scoped by undertaking ID.
- Only the author may claim discharge.
- Only the named other side may rebut.
- Only the two named sides may append to an EFFORT log.
- RESULT claims and rebuttals are one-time operations.
- EFFORT remains RUNNING even when its 30-entry storage cap is reached.
- No clock, payment, transfer, external web source, global administrator, or wallet-identity claim exists.

## Input fencing

Both semantic fields reject reserved outcome labels and XML-like prompt markers case-insensitively before consensus. The prompt builder removes those tokens repeatedly until stable, preventing nested fragments from reconstructing a marker.

## Novel consequence

The semantic outcome determines which data structure exists: a closed claim/rebuttal pair or a permanently open two-party log. It does not decide who speaks first, transfer ownership, grade risk, or decide whether a promise can fail.

## Frozen source

Project contract: 0x3B7BEb7cB1FDfEeDa58B89a77a77853CfAbc7166

Canonical SHA-256: 41e8ed9e10d1486e003c9fcede2f94a1b7a3b9894924f54cac1ddec847e6543d

No contract byte may be changed without a new hash, deployment, and runtime proof.
