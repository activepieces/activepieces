import { findAllPiecesDirectoryInSource } from '../utils/piece-script-utils'
import { preparePieceDistForPublish } from '../../../packages/cli/src/lib/utils/prepare-piece-utils'
import { chunk } from '@activepieces/core-utils'

function getChangedPiecePaths(): string[] | null {
    const changedPieces = process.env['CHANGED_PIECES']
    if (!changedPieces || changedPieces.trim() === '') {
        return null
    }
    return changedPieces.split('\n').filter(Boolean)
}

async function main(): Promise<void> {
    const changedPaths = getChangedPiecePaths()
    const piecePaths = changedPaths ?? await findAllPiecesDirectoryInSource()

    console.info(`[preparePieces] processing ${piecePaths.length} pieces${changedPaths ? ' (scoped to changed)' : ' (all)'}`)

    // Bundling is memory-heavy; cap concurrent bundles so a large changeset (e.g. a mass version
    // bump) can't OOM-kill the runner. Fire-and-forget over all pieces at once exhausts memory.
    const batches = chunk(piecePaths, 30)
    for (const batch of batches) {
        await Promise.all(batch.map(preparePieceDistForPublish))
    }

    console.info(`[preparePieces] done, prepared ${piecePaths.length} pieces`)
}

main()
