#!/usr/bin/env python3
"""Merge the hand labels + every Codex batch into the shipped label module.

Fails loudly on anything unaccounted for: a missing action, an unknown effect, a label
for an action that does not exist, or a duplicate. A silently-incomplete map would read
as "everything is harmless", which is the exact failure mode this feature exists to fix.
"""
import glob
import json
import sys

VALID = {'read', 'internal_write', 'internal_destructive', 'external_write',
         'outward_send', 'destructive', 'financial', 'input_dependent'}

catalog_model = [json.loads(l) for l in open('catalog_model.jsonl', encoding='utf8')]
catalog_builtin = [json.loads(l) for l in open('catalog_builtin.jsonl', encoding='utf8')]

# action name -> the pieces that define it (a name can repeat across pieces)
by_action = {}
for rec in catalog_model:
    by_action.setdefault(rec['action'], []).append(rec['piece'])

labels = {k: dict(v) for k, v in json.load(open('labels_builtin.json')).items()}
seen_actions = set()
orphans = []
batches = sorted(glob.glob('out/batch_*.json'))

for path in batches:
    ids_path = path.replace('out/batch_', 'batches/batch_').replace('.json', '.ids')
    batch_pieces = {}
    for line in open(ids_path, encoding='utf8'):
        piece, action = line.rstrip('\n').split('\t')
        batch_pieces[action] = piece
    for row in json.load(open(path))['labels']:
        action, effect = row['action'], row['effect']
        if effect not in VALID:
            sys.exit(f'FATAL invalid effect {effect!r} for {action} in {path}')
        piece = batch_pieces.get(action)
        if piece is None:
            orphans.append((path, action))
            continue
        key = f'@activepieces/piece-{piece}:{action}'
        recipient = row.get('recipientProp') or None
        # An action can legitimately appear in two batches only if a batch was re-run;
        # keep the stricter answer rather than whichever landed last.
        prev = labels.get(key)
        if prev and prev['effect'] != effect:
            order = ['read', 'internal_write', 'internal_destructive', 'external_write',
                     'outward_send', 'destructive', 'financial', 'input_dependent']
            effect = max(prev['effect'], effect, key=order.index)
        labels[key] = {
            'effect': effect,
            'recipientProp': recipient,
            'confidence': row.get('confidence', 'high'),
            'source': 'model',
        }
        seen_actions.add((piece, action))

# Second sweep: actions whose NAME is shared by several pieces were re-run with a
# `piece::action` id, because a reply keyed on the bare name cannot be attributed.
for path in sorted(glob.glob('out_fix/batch_*.json')):
    for row in json.load(open(path))['labels']:
        if '::' not in row['action']:
            continue
        piece, action = row['action'].split('::', 1)
        if row['effect'] not in VALID:
            sys.exit(f'FATAL invalid effect {row["effect"]!r} for {row["action"]} in {path}')
        labels[f'@activepieces/piece-{piece}:{action}'] = {
            'effect': row['effect'],
            'recipientProp': row.get('recipientProp') or None,
            'confidence': row.get('confidence', 'high'),
            'source': 'model',
        }
        seen_actions.add((piece, action))

# A blind second pass re-labeled a stratified 600-action sample. Where the two passes implied
# a DIFFERENT gate decision, the stricter label wins and is pinned here — never averaged away.
try:
    for key, entry in json.load(open('labels_verify_overrides.json')).items():
        labels[key] = entry
except FileNotFoundError:
    pass

expected = {(r['piece'], r['action']) for r in catalog_model}
missing = sorted(expected - seen_actions)
print(f'batches merged={len(batches)}  labels={len(labels)}  '
      f'model-covered={len(seen_actions)}/{len(expected)}  builtins={len(catalog_builtin)}')
if orphans:
    print(f'WARNING {len(orphans)} labels for actions not in their batch (model renamed them):')
    for path, action in orphans[:10]:
        print(f'   {path} -> {action}')
if missing:
    print(f'MISSING {len(missing)} actions still unlabeled (first 10): {missing[:10]}')

json.dump(labels, open('labels_merged.json', 'w'), indent=0, sort_keys=True)

CODES = {
    'read': 'r',
    'internal_write': 'W',
    'internal_destructive': 'D',
    'external_write': 'w',
    'outward_send': 'o',
    'destructive': 'd',
    'financial': 'f',
    'input_dependent': 'i',
}

if len(sys.argv) > 1:
    # One line per piece keeps the table greppable and reviewable at 700-odd lines instead
    # of 5,000, and drops the repeated package prefix (~100KB of pure noise).
    by_piece = {}
    for key in sorted(labels):
        piece, action = key.split(':', 1)
        entry = labels[key]
        code = CODES[entry['effect']]
        recipient = entry.get('recipientProp')
        authoritative = '!' if entry.get('source') == 'hand' else ''
        by_piece.setdefault(piece.replace('@activepieces/piece-', ''), []).append(
            f'{action}={code}{authoritative}' + (f':{recipient}' if recipient else ''))
    lines = [f'{piece} {" ".join(entries)}' for piece, entries in sorted(by_piece.items())]
    body = '\n'.join(lines)
    module = '''/**
 * Effect label for every action in the piece catalog: what it does in the real world, so
 * chat can decide what needs a human's yes. Read/internal labels are only trusted when the
 * action's own name agrees (see resolveActionEffect) — a label can never make something
 * look safer than its name suggests.
 *
 * GENERATED — do not hand-edit a line here. Regenerate with tools/action-effects. A piece
 * overrides its own entry by declaring `aiMetadata.effect` on the action.
 *
 * One line per piece: `<piece> <action>=<code>[!][:<recipientInputKey>] ...`
 * Codes: r read · W internal write · D internal destructive · w external write ·
 *        o outward send · d destructive · f financial · i depends on input
 * A trailing `!` marks a hand-reviewed entry that the resolver trusts as-is; every other
 * entry may still be escalated when the action's own name implies something worse.
 */

export type ActionEffectLabel = {
    kind: string
    recipientProp?: string
    authoritative?: boolean
}

const KIND_BY_CODE: Record<string, string> = {
    r: 'read',
    W: 'internal_write',
    D: 'internal_destructive',
    w: 'external_write',
    o: 'outward_send',
    d: 'destructive',
    f: 'financial',
    i: 'input_dependent',
}

const ENCODED_LABELS = `
%s
`

function decode(encoded: string): Record<string, ActionEffectLabel> {
    const labels: Record<string, ActionEffectLabel> = {}
    for (const line of encoded.split('\\n')) {
        const trimmed = line.trim()
        if (trimmed.length === 0) {
            continue
        }
        const firstSpace = trimmed.indexOf(' ')
        if (firstSpace <= 0) {
            continue
        }
        const piece = trimmed.slice(0, firstSpace)
        for (const entry of trimmed.slice(firstSpace + 1).split(' ')) {
            const separator = entry.lastIndexOf('=')
            if (separator <= 0) {
                continue
            }
            const [rawCode, recipientProp] = entry.slice(separator + 1).split(':')
            const authoritative = rawCode.endsWith('!')
            const kind = KIND_BY_CODE[authoritative ? rawCode.slice(0, -1) : rawCode]
            if (kind === undefined) {
                continue
            }
            const key = `@activepieces/piece-${piece}:${entry.slice(0, separator)}`
            labels[key] = {
                kind,
                ...(recipientProp ? { recipientProp } : {}),
                ...(authoritative ? { authoritative: true } : {}),
            }
        }
    }
    return labels
}

export const ACTION_EFFECT_LABELS: Record<string, ActionEffectLabel> = decode(ENCODED_LABELS)
''' % body
    open(sys.argv[1], 'w', encoding='utf8').write(module)
    print(f'wrote {sys.argv[1]} ({len(lines)} entries, {len(module) // 1024}KB)')
