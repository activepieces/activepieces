# Action effect labels

Regenerates `packages/core/shared/src/lib/ee/chat/action-effect-labels.ts` — the table that tells
the chat agent what each piece action does in the real world (read / external write / outward send /
destructive / financial / depends-on-input), which is what its consent gates are decided from.

A name-based rule cannot do this job: 44% of the catalog matches no read or write verb at all, and a
quarter of action names are single-token camelCase (`sendMessage`, `deleteFile`), invisible to any
separator-split word list. So every action is labeled once, offline, and the label ships with the code.

## Pipeline

```bash
cd tools/action-effects

python3 extract_actions.py ../../packages/pieces catalog.jsonl     # 1. every createAction in the repo
python3 builtin_labels.py catalog_builtin.jsonl labels_builtin.json # 2. built-ins, by hand
CONC=6 ./drive.sh                                                   # 3. the rest, one model batch at a time
python3 build_label_module.py ../../packages/core/shared/src/lib/ee/chat/action-effect-labels.ts
```

Step 2's 91 built-in actions (Tables, Store, files, AI, HTTP, subflows…) are labeled by hand and
marked authoritative — they are what the agent touches constantly, so a wrong label there is felt on
every task, and the resolver trusts them as-is instead of second-guessing them from their names.

Everything else is labeled in batches of 40 by a model, then a blind second pass re-labels a
stratified sample. Where the two passes disagreed on whether the action needs a human's yes, the
stricter label is pinned in `labels_verify_overrides.json` and applied last.

`build_label_module.py` fails loudly if any action ends up unlabeled: a silently incomplete table
would read as "everything is harmless", which is the failure this feature exists to remove.

## Adding a piece

Nothing to do. An unlabeled action resolves to `unknown`, and `unknown` asks the user — new pieces
degrade to "one extra confirmation", never to "runs silently". To label it properly, either declare
`aiMetadata.effect` on the action (authoritative for that action, and it cannot claim to be safer
than its own name implies) or re-run this pipeline.
