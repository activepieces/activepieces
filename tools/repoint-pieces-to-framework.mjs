// Repoint community pieces: imports of @activepieces/core-utils / core-piece-types
// now come from @activepieces/pieces-framework (which re-exports them), so pieces
// depend only on framework + common. Also drops the core-* deps from package.json.

import fs from 'node:fs'
import path from 'node:path'

const REPO = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..')
const COMMUNITY = path.join(REPO, 'packages', 'pieces', 'community')

function walk(dir) {
    let result = []
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name)
        if (entry.isDirectory()) result = result.concat(walk(full))
        else if (full.endsWith('.ts')) result.push(full)
    }
    return result
}

let filesChanged = 0
let pkgsChanged = 0
for (const piece of fs.readdirSync(COMMUNITY)) {
    const dir = path.join(COMMUNITY, piece)
    const src = path.join(dir, 'src')
    if (!fs.existsSync(src)) continue

    for (const file of walk(src)) {
        let content = fs.readFileSync(file, 'utf8')
        if (!content.includes('@activepieces/core-utils') && !content.includes('@activepieces/core-piece-types')) continue
        const next = content
            .replaceAll("from '@activepieces/core-utils'", "from '@activepieces/pieces-framework'")
            .replaceAll("from '@activepieces/core-piece-types'", "from '@activepieces/pieces-framework'")
        if (next !== content) {
            fs.writeFileSync(file, next)
            filesChanged++
        }
    }

    const pkgPath = path.join(dir, 'package.json')
    if (fs.existsSync(pkgPath)) {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'))
        const deps = pkg.dependencies ?? {}
        let changed = false
        for (const coreDep of ['@activepieces/core-utils', '@activepieces/core-piece-types']) {
            if (deps[coreDep]) { delete deps[coreDep]; changed = true }
        }
        if (changed && !deps['@activepieces/pieces-framework']) {
            deps['@activepieces/pieces-framework'] = 'workspace:*'
        }
        if (changed) {
            pkg.dependencies = deps
            fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n')
            pkgsChanged++
        }
    }
}
console.log(`files repointed to framework: ${filesChanged}`)
console.log(`package.json files cleaned of core-* deps: ${pkgsChanged}`)
