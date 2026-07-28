#!/usr/bin/env python3
"""Merge the hand labels + every model batch into the shipped label module.

Fails hard on anything unaccounted for: an action with no label, an unknown effect,
an action name the encoding cannot carry, or a key collision. A silently-incomplete
map would read as "everything is harmless", which is the exact failure mode this
feature exists to fix. Labels for actions that no longer exist are dropped with a
notice (pieces get deleted; that is normal).

Inputs, resolved from the working directory:
  catalog.jsonl              full catalog from extract_actions.py (piece = package name)
  labels_builtin.json        from builtin_labels.py (hand)
  out/batch_*.json           model batch replies, keyed by bare action name
  batches/batch_*.ids        piece attribution for those replies
  out_fix/batch_*.json       re-runs keyed piece::action for name collisions
  labels_added_*.json        reviewed labels for actions found after the model pass
  labels_verify_overrides.json  stricter-label pins from the blind verify pass

Usage: build_label_module.py [<output .ts path>]
"""
import glob
import json
import sys

VALID = {'read', 'internal_write', 'internal_destructive', 'external_write',
         'outward_send', 'destructive', 'financial', 'input_dependent'}

STRICTNESS = ['read', 'internal_write', 'internal_destructive', 'external_write',
              'outward_send', 'destructive', 'financial', 'input_dependent']

FORBIDDEN = set('=:!`"\'\n\t')


def package_key(piece, action):
    prefixed = piece if piece.startswith('@activepieces/piece-') else f'@activepieces/piece-{piece}'
    return f'{prefixed}:{action}'


def encode_token(value):
    for ch in FORBIDDEN:
        if ch in value:
            sys.exit(f'FATAL {value!r} contains {ch!r} and cannot be encoded')
    return value.replace('%', '%25').replace(' ', '%20')


catalog = [json.loads(line) for line in open('catalog.jsonl', encoding='utf8')]
expected = {package_key(r['piece'], r['action']) for r in catalog}

labels = {k: dict(v) for k, v in json.load(open('labels_builtin.json')).items()}
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
        key = package_key(piece, action)
        prev = labels.get(key)
        if prev and prev['effect'] != effect:
            effect = max(prev['effect'], effect, key=STRICTNESS.index)
        labels[key] = {
            'effect': effect,
            'recipientProp': row.get('recipientProp') or None,
            'confidence': row.get('confidence', 'high'),
            'source': 'model',
        }

for path in sorted(glob.glob('out_fix/batch_*.json')):
    for row in json.load(open(path))['labels']:
        if '::' not in row['action']:
            continue
        piece, action = row['action'].split('::', 1)
        if row['effect'] not in VALID:
            sys.exit(f'FATAL invalid effect {row["effect"]!r} for {row["action"]} in {path}')
        labels[package_key(piece, action)] = {
            'effect': row['effect'],
            'recipientProp': row.get('recipientProp') or None,
            'confidence': row.get('confidence', 'high'),
            'source': 'model',
        }

for path in sorted(glob.glob('labels_added_*.json')):
    for key, entry in json.load(open(path)).items():
        if entry['effect'] not in VALID:
            sys.exit(f'FATAL invalid effect {entry["effect"]!r} for {key} in {path}')
        labels[key] = dict(entry)

try:
    for key, entry in json.load(open('labels_verify_overrides.json')).items():
        labels[key] = dict(entry)
except FileNotFoundError:
    pass

stale = sorted(set(labels) - expected)
for key in stale:
    del labels[key]
missing = sorted(expected - set(labels))

print(f'batches merged={len(batches)}  labels={len(labels)}  catalog={len(expected)}')
if stale:
    print(f'DROPPED {len(stale)} labels whose action no longer exists:')
    for key in stale[:20]:
        print(f'   {key}')
if orphans:
    print(f'{len(orphans)} batch replies for actions not in their batch (model renamed them):')
    for path, action in orphans[:10]:
        print(f'   {path} -> {action}')
    sys.exit('FATAL: orphaned replies — re-run those actions with piece::action ids (out_fix)')
if missing:
    print(f'MISSING {len(missing)} actions still unlabeled:')
    for key in missing[:20]:
        print(f'   {key}')
    sys.exit('FATAL: refusing to write a partial table — label the missing actions first')

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
    by_piece = {}
    seen_keys = set()
    for key in sorted(labels):
        piece, action = key.split(':', 1)
        entry = labels[key]
        code = CODES[entry['effect']]
        recipient = entry.get('recipientProp')
        authoritative = '!' if entry.get('source') == 'hand' else ''
        short_piece = encode_token(piece.replace('@activepieces/piece-', ''))
        token = f'{encode_token(action)}={code}{authoritative}'
        if recipient:
            token += f':{encode_token(recipient)}'
        collision_key = f'{short_piece}:{encode_token(action)}'
        if collision_key in seen_keys:
            sys.exit(f'FATAL encoded key collision for {collision_key}')
        seen_keys.add(collision_key)
        by_piece.setdefault(short_piece, []).append(token)
    lines = [f'{piece} {" ".join(entries)}' for piece, entries in sorted(by_piece.items())]
    body = '\n'.join(lines)
    module = '''/**
 * Effect label for every action in the piece catalog: what it does in the real world, so
 * chat can decide what needs a human's yes before it runs.
 *
 * GENERATED — do not hand-edit a line here. Regenerate with tools/action-effects; the
 * generator refuses to write a partial table. A piece overrides its own entry by
 * declaring `aiMetadata.effect` on the action, which the resolver trusts outright.
 *
 * One line per piece: `<piece> <action>=<code>[!][:<recipientInputKey>] ...` with
 * spaces in names carried as %%20 (and %% as %%25).
 * Codes: r read | W internal write | D internal destructive | w external write |
 *        o outward send | d destructive | f financial | i depends on input
 * A trailing `!` marks a hand-reviewed entry the resolver trusts as-is; any other
 * read/internal label may be escalated when the action's own name clearly implies an
 * external effect and contains no read verb (see resolveActionEffect).
 *
 * The table is decoded on first use, never at import time, and reaches the resolver
 * only through actionEffect.setCatalog on server boot — the web bundle must not pay
 * for it. Keep this file free of top-level work.
 */

import { ActionEffectKind, ActionEffectLabel } from './action-effect'

const KIND_BY_CODE: Record<string, ActionEffectKind> = {
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

function decodeToken(raw: string): string {
    return raw.replace(/%%20/g, ' ').replace(/%%25/g, '%%')
}

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
        const piece = decodeToken(trimmed.slice(0, firstSpace))
        for (const entry of trimmed.slice(firstSpace + 1).split(' ')) {
            const separator = entry.lastIndexOf('=')
            if (separator <= 0) {
                continue
            }
            const [rawCode, rawRecipient] = entry.slice(separator + 1).split(':')
            const authoritative = rawCode.endsWith('!')
            const kind = KIND_BY_CODE[authoritative ? rawCode.slice(0, -1) : rawCode]
            if (kind === undefined) {
                continue
            }
            const key = `@activepieces/piece-${piece}:${decodeToken(entry.slice(0, separator))}`
            labels[key] = {
                kind,
                ...(rawRecipient ? { recipientProp: decodeToken(rawRecipient) } : {}),
                ...(authoritative ? { authoritative: true } : {}),
            }
        }
    }
    return labels
}

let decoded: Record<string, ActionEffectLabel> | undefined

function loadActionEffectLabels(): Record<string, ActionEffectLabel> {
    if (decoded === undefined) {
        decoded = decode(ENCODED_LABELS)
    }
    return decoded
}

export const actionEffectLabelCatalog = {
    load: loadActionEffectLabels,
}
''' % body
    open(sys.argv[1], 'w', encoding='utf8').write(module)
    print(f'wrote {sys.argv[1]} ({sum(len(v) for v in by_piece.values())} entries, {len(module) // 1024}KB)')
