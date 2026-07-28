#!/usr/bin/env python3
"""Extract every piece action from the Activepieces source into one JSONL catalog.

One record per createAction({...}) block: piece package name, action name, displayName,
description, the auto-generated aiMetadata.description, and the top-level prop keys.
Brace-matched (not line-based) so multi-line descriptions and nested props survive, and
comments are stripped first so an apostrophe in a // comment cannot derail the matcher
(that exact bug silently dropped whole pieces from the first catalog).

The piece is identified by its package.json "name", never by folder name — the two
disagree (e.g. community/call-rounded is @activepieces/piece-rounded-studio).

Fails loudly on an action name that cannot survive the label encoding.
"""
import json
import os
import re
import sys

ROOT = sys.argv[1]
OUT = sys.argv[2]

CREATE_RE = re.compile(r'createAction\s*(?:<[^>]*>)?\s*\(\s*\{')
SKIP_DIRS = {'common', 'framework', 'node_modules', 'dist'}
NAME_FORBIDDEN = re.compile(r'[=:!?`"\'\n\t${}]')


REGEX_PRECEDING = set('(,=:[!&|?{};+-*%~^<>\n')


def strip_comments(text):
    """Remove comments and blank out regex-literal bodies, string-aware.

    Offsets are preserved with spaces. Regex bodies are blanked because a quote or
    brace inside a regex literal (e.g. .replace(/"/g, ...)) derails brace matching,
    and nothing downstream ever reads a regex.
    """
    out = []
    i = 0
    n = len(text)
    in_str = None
    last_sig = '\n'
    while i < n:
        ch = text[i]
        if in_str:
            out.append(ch)
            if ch == '\\' and i + 1 < n:
                out.append(text[i + 1])
                i += 2
                continue
            if ch == in_str:
                in_str = None
                last_sig = ch
            i += 1
            continue
        if ch in '"\'`':
            in_str = ch
            out.append(ch)
            i += 1
            continue
        if ch == '/' and i + 1 < n and text[i + 1] == '/':
            while i < n and text[i] != '\n':
                out.append(' ')
                i += 1
            continue
        if ch == '/' and i + 1 < n and text[i + 1] == '*':
            while i + 1 < n and not (text[i] == '*' and text[i + 1] == '/'):
                out.append('\n' if text[i] == '\n' else ' ')
                i += 1
            out.append('  ')
            i += 2
            continue
        if ch == '/' and last_sig in REGEX_PRECEDING:
            out.append(' ')
            i += 1
            in_class = False
            while i < n:
                rc = text[i]
                if rc == '\\' and i + 1 < n:
                    out.append('  ')
                    i += 2
                    continue
                if rc == '[':
                    in_class = True
                elif rc == ']':
                    in_class = False
                elif rc == '/' and not in_class:
                    out.append(' ')
                    i += 1
                    while i < n and text[i].isalpha():
                        out.append(' ')
                        i += 1
                    break
                elif rc == '\n':
                    break
                out.append(' ')
                i += 1
            last_sig = '0'
            continue
        out.append(ch)
        if not ch.isspace() or ch == '\n':
            last_sig = ch
        i += 1
    return ''.join(out)


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


def literal_name(raw):
    """Only accept a plain quoted string literal as an action name."""
    if raw is None:
        return None
    raw = raw.strip()
    if raw[:1] not in '"\'' or raw[-1:] != raw[:1]:
        return None
    inner = raw[1:-1]
    if NAME_FORBIDDEN.search(inner) or not inner.strip():
        return None
    return inner.strip()


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


def piece_package_names(root):
    """Map each piece directory to its package.json name."""
    names = {}
    for dirpath, dirs, files in os.walk(root):
        dirs[:] = [d for d in dirs if d not in SKIP_DIRS]
        if 'package.json' in files:
            try:
                pkg = json.load(open(os.path.join(dirpath, 'package.json'), encoding='utf8'))
            except (OSError, ValueError):
                continue
            name = pkg.get('name', '')
            if name.startswith('@activepieces/piece-'):
                names[dirpath] = name
    return names


def piece_of(path, package_names):
    d = os.path.dirname(path)
    while d and d != os.path.dirname(d):
        if d in package_names:
            return package_names[d]
        d = os.path.dirname(d)
    return None


package_names = piece_package_names(ROOT)
records = []
seen = set()
bad_names = []
for dirpath, dirs, files in os.walk(ROOT):
    dirs[:] = [d for d in dirs if d not in SKIP_DIRS]
    for fn in files:
        if not fn.endswith('.ts') or fn.endswith('.d.ts') or fn.endswith('.test.ts'):
            continue
        path = os.path.join(dirpath, fn)
        try:
            text = open(path, encoding='utf8', errors='replace').read()
        except OSError:
            continue
        if 'createAction' not in text:
            continue
        text = strip_comments(text)
        for m in CREATE_RE.finditer(text):
            open_idx = text.index('{', m.end() - 1)
            body, _ = match_block(text, open_idx)
            if body is None:
                bad_names.append((path, 'unbalanced braces'))
                continue
            raw_name = top_level_field(body, 'name')
            name = literal_name(raw_name)
            if not name:
                if raw_name is not None:
                    bad_names.append((path, f'non-literal action name: {raw_name[:80]!r}'))
                continue
            piece = piece_of(path, package_names)
            if piece is None:
                bad_names.append((path, f'no piece package.json above this file for {name!r}'))
                continue
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

if bad_names:
    for path, reason in bad_names:
        print(f'SKIPPED {path}: {reason}', file=sys.stderr)

records.sort(key=lambda r: (r['piece'], r['action']))
with open(OUT, 'w', encoding='utf8') as fh:
    for r in records:
        fh.write(json.dumps(r, ensure_ascii=False) + '\n')

pieces = len({r['piece'] for r in records})
missing_desc = sum(1 for r in records if not r['description'])
with_ai = sum(1 for r in records if r['aiDescription'])
no_props = sum(1 for r in records if not r['props'])
print(f'actions={len(records)} pieces={pieces} missing_description={missing_desc} '
      f'with_aiDescription={with_ai} no_props={no_props} skipped={len(bad_names)}')
if any(reason == 'unbalanced braces' for _, reason in bad_names):
    sys.exit('FATAL: files with unbalanced braces were skipped — the catalog is incomplete')
