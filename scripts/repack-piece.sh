#!/bin/bash
# Rewrites a piece .tgz to strip workspace:* deps so AP's installer can unpack it.
set -euo pipefail

INPUT="$1"
OUT_DIR="$(dirname "$INPUT")"
WORK=$(mktemp -d)

tar -xzf "$INPUT" -C "$WORK"
PKG_DIR="$WORK/package"

python3 - "$PKG_DIR/package.json" <<'PYEOF'
import json, sys
p = sys.argv[1]
with open(p) as f:
    pkg = json.load(f)

# Strip workspace deps — the worker provides these at runtime.
deps = pkg.get('dependencies', {})
clean = {k: v for k, v in deps.items() if not str(v).startswith('workspace:')}
if clean:
    pkg['dependencies'] = clean
else:
    pkg.pop('dependencies', None)

# devDependencies also unusable — drop entirely.
pkg.pop('devDependencies', None)

with open(p, 'w') as f:
    json.dump(pkg, f, indent=2)
print(f"✓ stripped deps from {pkg.get('name')}")
PYEOF

# Repack
cd "$WORK"
tar -czf "/tmp/repacked.tgz" package
cd - >/dev/null
mv /tmp/repacked.tgz "$INPUT"
rm -rf "$WORK"
echo "✓ repacked: $INPUT"
