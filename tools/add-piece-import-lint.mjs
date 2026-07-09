// Add the import-boundary lint rule to every community piece's .eslintrc.json:
// pieces may not import @activepieces/core-*, server*, or engine (they depend only
// on framework + common). Injected into each config's "*.ts" override.

import fs from 'node:fs'
import path from 'node:path'

const REPO = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..')
const COMMUNITY = path.join(REPO, 'packages', 'pieces', 'community')

const RULE = ['error', {
    patterns: [
        'lodash',
        'lodash/*',
        '@activepieces/core-*',
        '@activepieces/server*',
        '@activepieces/engine',
    ],
}]

let updated = 0
for (const piece of fs.readdirSync(COMMUNITY)) {
    const cfgPath = path.join(COMMUNITY, piece, '.eslintrc.json')
    if (!fs.existsSync(cfgPath)) continue
    const raw = fs.readFileSync(cfgPath, 'utf8').replace(/^﻿/, '')
    let cfg
    try {
        cfg = JSON.parse(raw)
    } catch {
        console.warn(`skip (unparseable): ${piece}`)
        continue
    }
    const overrides = cfg.overrides ?? []
    // Target the TS-only override (files === ["*.ts","*.tsx"]).
    const tsOverride = overrides.find((o) =>
        Array.isArray(o.files) && o.files.includes('*.ts') && !o.files.includes('*.js'))
    if (!tsOverride) continue
    tsOverride.rules = tsOverride.rules ?? {}
    tsOverride.rules['no-restricted-imports'] = RULE
    fs.writeFileSync(cfgPath, JSON.stringify(cfg, null, 2) + '\n')
    updated++
}
console.log(`piece .eslintrc.json files updated: ${updated}`)
