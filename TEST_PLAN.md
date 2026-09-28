# Test plan

## Semantic matrix

Each opening uses other_label = the Client. These cases exercise meaning rather than vocabulary.

| Case | Expected | Exact text |
|---|---|---|
| D3 | RESULT_OWED | The backlog will be cleared. |
| E3 | EFFORT_OWED | The backlog will be worked on daily. |
| D1 | RESULT_OWED | We will use a dedicated team and the data will be fully migrated. |
| E1 | EFFORT_OWED | We will use reasonable care in handling the data. |
| D4 | RESULT_OWED | We will apply every available method, and the licence will be approved. |
| E4 | EFFORT_OWED | We will pursue the licence application diligently. |
| D5 | RESULT_OWED | The site will be live on the new host. |
| E2 | EFFORT_OWED | We will keep trying to reach the supplier. |
| D2 | RESULT_OWED | We will deliver a signed audit certificate. |
| E5 | EFFORT_OWED | Best endeavours will be applied to the migration. |

D3/E3, D1/E1, D4/E4, and D5/E2 are adversarial pairs whose shared surface does not reveal the answer. D2/E5 checks direct compliance with the semantic definition.

## Production-contract tests

The Python suite imports the exact packaged production source with a minimal GenLayer runtime stub. It covers:

1. other_wallet equal to author reverts before classification;
2. outsider claim, rebuttal, and log calls revert;
3. rebuttal before a claim reverts;
4. second claim and second rebuttal revert;
5. a full EFFORT log rejects another entry without closing;
6. reserved tokens in text or label revert;
7. equivalent whitespace creates the same ID and blocks a duplicate;
8. mixed-case other-side wallet is normalized;
9. RESULT and EFFORT enforce opposite method shapes;
10. malformed output fails toward EFFORT_OWED;
11. validator disagreement creates no storage;
12. views expose the exact permanent state.

## Frontend tests

- Python-compatible stripping and whitespace collapse across spaces, tabs, newlines, U+001C–U+001F, U+0085, and extended Unicode spaces.
- Unicode code-point length rather than UTF-16 length.
- Keccak ID equality against frozen D3 and E3 vectors.
- Finalized SUCCESS receipt parsing.
- Missing execution result remains pending.
- Leader selection from receipt arrays.
- Exact rollback reason extraction.
- React text-node escaping for hostile contract text.
- All four actions remain in the UI.
- Exact disabled-method explanations are present.
- Finalized duplicate preflight occurs before submission.
- Same-origin proxy exists in Vite and Vercel.
- genlayer-js and viem versions are pinned and deduplicated.

## Project browser proof

The Project deployment uses a separate address and fresh state. The tester opens fresh D3 and E3 records with two wallets, verifies their opposite shapes, makes one RESULT claim, writes one EFFORT log from the other wallet, and captures the two records side by side. No shared demo record is required.

Full status and the exact remaining path are in TESTING.md.
