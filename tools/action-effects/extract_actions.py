#!/usr/bin/env python3
"""Extract every piece action from the Activepieces source into one JSONL catalog.

One record per createAction({...}) block: piece folder, action name, displayName,
description, the auto-generated aiMetadata.description, and the top-level prop keys.
Brace-matched (not line-based) so multi-line descriptions and nested props survive.
"""
import json
import os
import re
import sys

ROOT = sys.argv[1]
OUT = sys.argv[2]

CREATE_RE = re.compile(r'createAction\s*\(\s*\{')


def match_block(text, open_idx):
    """Return (body, end_idx) for the object literal whose '{' is at open_idx."""
    depth = 0
    i = open_idx
    in_str = None
    while i < len(text):
        ch = text[i]
        if in_str:
            if ch == '\\':
                i += 2
                continue
            if ch == in_str:
                in_str = None
        elif ch in '"\'`':
            in_str = ch
        elif ch == '{':
            depth += 1
        elif ch == '}':
            depth -= 1
            if depth == 0:
                return text[open_idx + 1:i], i
        i += 1
    return None, None


def top_level_field(body, key):
    """Value of `key:` at depth 0 of an object body, as raw source text."""
    pat = re.compile(r'(^|[\n,])\s*' + re.escape(key) + r'\s*:', re.M)
    depth = 0
    in_str = None
    i = 0
    starts = []
    while i < len(body):
        ch = body[i]
        if in_str:
            if ch == '\\':
                i += 2
                continue
            if ch == in_str:
                in_str = None
        elif ch in '"\'`':
            in_str = ch
        elif ch in '{[(':
            depth += 1
        elif ch in '}])':
            depth -= 1
        elif depth == 0:
            m = pat.match(body, i if i == 0 else i - 1)
            if m:
                starts.append(m.end())
        i += 1
    if not starts:
        return None
    start = starts[0]
    # read until a depth-0 comma
    depth = 0
    in_str = None
    j = start
    while j < len(body):
        ch = body[j]
        if in_str:
            if ch == '\\':
                j += 2
                continue
            if ch == in_str:
                in_str = None
        elif ch in '"\'`':
            in_str = ch
        elif ch in '{[(':
            depth += 1
        elif ch in '}])':
            if depth == 0:
                break
            depth -= 1
        elif ch == ',' and depth == 0:
            break
        j += 1
    return body[start:j].strip()


def unquote(raw, limit=600):
    if raw is None:
        return None
    raw = raw.strip()
    if raw[:1] in '"\'`' and len(raw) > 1:
        q = raw[0]
        end = raw.rfind(q)
        if end > 0:
            raw = raw[1:end]
    raw = re.sub(r'\s+', ' ', raw).strip()
    return raw[:limit] if raw else None


def prop_keys(raw, limit=25):
    if raw is None or not raw.startswith('{'):
        return []
    body, _ = match_block(raw, 0)
    if body is None:
        return []
    keys = []
    depth = 0
    in_str = None
    i = 0
    line_start = 0
    while i < len(body):
        ch = body[i]
        if in_str:
            if ch == '\\':
                i += 2
                continue
            if ch == in_str:
                in_str = None
        elif ch in '"\'`':
            in_str = ch
        elif ch in '{[(':
            depth += 1
        elif ch in '}])':
            depth -= 1
        elif ch == ':' and depth == 0:
            seg = body[line_start:i]
            m = re.search(r"([A-Za-z_$][\w$]*|'[^']+'|\"[^\"]+\")\s*$", seg)
            if m:
                keys.append(m.group(1).strip('\'"'))
            line_start = i + 1
        elif ch == ',' and depth == 0:
            line_start = i + 1
        i += 1
    return keys[:limit]


def piece_of(path):
    parts = path.split(os.sep)
    if 'pieces' in parts:
        k = parts.index('pieces')
        if len(parts) > k + 2:
            return parts[k + 2]
    return '?'


records = []
seen = set()
for dirpath, _dirs, files in os.walk(ROOT):
    for fn in files:
        if not fn.endswith('.ts') or fn.endswith('.d.ts'):
            continue
        path = os.path.join(dirpath, fn)
        try:
            text = open(path, encoding='utf8', errors='replace').read()
        except OSError:
            continue
        if 'createAction' not in text:
            continue
        for m in CREATE_RE.finditer(text):
            open_idx = text.index('{', m.end() - 1)
            body, _ = match_block(text, open_idx)
            if body is None:
                continue
            name = unquote(top_level_field(body, 'name'), 120)
            if not name:
                continue
            piece = piece_of(path)
            key = (piece, name)
            if key in seen:
                continue
            seen.add(key)
            ai = top_level_field(body, 'aiMetadata')
            ai_desc = None
            if ai and ai.startswith('{'):
                ai_body, _ = match_block(ai, 0)
                if ai_body:
                    ai_desc = unquote(top_level_field(ai_body, 'description'), 500)
            records.append({
                'piece': piece,
                'action': name,
                'displayName': unquote(top_level_field(body, 'displayName'), 150),
                'description': unquote(top_level_field(body, 'description'), 350),
                'aiDescription': ai_desc,
                'props': prop_keys(top_level_field(body, 'props')),
                'file': os.path.relpath(path, ROOT),
            })

records.sort(key=lambda r: (r['piece'], r['action']))
with open(OUT, 'w', encoding='utf8') as fh:
    for r in records:
        fh.write(json.dumps(r, ensure_ascii=False) + '\n')

pieces = len({r['piece'] for r in records})
missing_desc = sum(1 for r in records if not r['description'])
with_ai = sum(1 for r in records if r['aiDescription'])
no_props = sum(1 for r in records if not r['props'])
print(f'actions={len(records)} pieces={pieces} missing_description={missing_desc} '
      f'with_aiDescription={with_ai} no_props={no_props}')
