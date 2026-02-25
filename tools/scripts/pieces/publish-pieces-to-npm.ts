import { publishNpmPackage } from '../utils/publish-npm-package'
import { findAllPiecesDirectoryInSource } from '../utils/piece-script-utils'
import { chunk } from '../../../packages/shared/src/lib/common/utils/utils'

function getChangedPiecePaths(): string[] | null {
  const changedPieces = process.env['CHANGED_PIECES']
  if (!changedPieces || changedPieces.trim() === '') {
    return null
  }
  return changedPieces.split('\n').filter(Boolean)
}

const main = async () => {
  const changedPaths = getChangedPiecePaths()
  const piecesSource = changedPaths ?? await findAllPiecesDirectoryInSource()

  console.info(`[publishPieces] publishing ${piecesSource.length} pieces${changedPaths ? ' (scoped to changed)' : ' (all)'}`)

  const piecesSourceChunks = chunk(piecesSource, 30)

  for (const chunk of piecesSourceChunks) {
    await Promise.all(chunk.map((path) => publishNpmPackage(path)))
    await new Promise(resolve => setTimeout(resolve, 5000))
  }
}

main()