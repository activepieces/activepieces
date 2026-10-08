import { publishNpmPackage } from '../utils/publish-npm-package'
import { findAllPiecesDirectoryInSource } from '../utils/piece-script-utils'
import { chunk } from '@activepieces/core-utils'

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
  const failedPaths: string[] = []

  for (const chunk of piecesSourceChunks) {
    const results = await Promise.allSettled(chunk.map((path) => publishNpmPackage(path)))
    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        console.error(`[publishPieces] FAILED path=${chunk[index]}`, result.reason)
        failedPaths.push(chunk[index])
      }
    })
    await new Promise(resolve => setTimeout(resolve, 5000))
  }

  if (failedPaths.length > 0) {
    console.error(`[publishPieces] ${failedPaths.length}/${piecesSource.length} piece(s) failed to publish:\n  ${failedPaths.join('\n  ')}`)
    process.exitCode = 1
  }
}

main()