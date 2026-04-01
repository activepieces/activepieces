import { findAllPiecesDirectoryInSource } from '../utils/piece-script-utils'
import { parseBunLock, preparePieceDistForPublish } from '../../../packages/cli/src/lib/utils/prepare-piece-utils'

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

    const parsedBunLock = parseBunLock()

    let preparedCount = 0
    for (const piecePath of piecePaths) {
        preparePieceDistForPublish(piecePath, parsedBunLock)
        preparedCount++
    }

    console.info(`[preparePieces] done, prepared ${preparedCount} pieces`)
}

main()
