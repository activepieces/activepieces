/**
 * Standalone Node entrypoint that loads a piece's compiled JS and prints its
 * metadata as JSON on stdout. Invoked as a child process from
 * `piece-script-utils.ts:loadPieceFromFolder` so that the piece's
 * `require('@activepieces/pieces-framework')` resolves via standard
 * node_modules lookup — matching the pinned framework inside the piece's
 * package.json — instead of being intercepted by `tsconfig-paths/register`
 * in the parent script (which would redirect to the local workspace
 * framework and silently clobber `minimumSupportedRelease` via the floor
 * check in `Piece`'s constructor).
 *
 * Usage: node load-piece-metadata-child.mjs <pieceDistFolder>
 */

import { createRequire } from 'node:module'
import { resolve } from 'node:path'

const folderPath = process.argv[2]
if (!folderPath) {
    console.error('[load-piece-metadata-child] missing folder path argv')
    process.exit(2)
}

const entryPath = resolve(folderPath, 'src', 'index.js')
const require = createRequire(import.meta.url)
const module = require(entryPath)

let piece = null
for (const exported of Object.values(module)) {
    if (exported !== null && exported !== undefined && exported.constructor?.name === 'Piece') {
        piece = exported
        break
    }
}

if (!piece) {
    console.error(`[load-piece-metadata-child] no Piece export found in ${entryPath}`)
    process.exit(3)
}

const payload = {
    metadata: piece.metadata(),
    minimumSupportedRelease: piece.minimumSupportedRelease ?? null,
    maximumSupportedRelease: piece.maximumSupportedRelease ?? null,
    authors: piece.authors ?? [],
}

process.stdout.write(JSON.stringify(payload))
