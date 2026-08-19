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
    // One piece's failed publish must not block the rest of the release — a single
    // rejected publish (e.g. an npm permission error on one new package) would otherwise
    // strand every other piece queued in the same run. Collect failures, publish the
    // rest, and fail the run at the end so alerting still fires.
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
    process.exit(1)
  }
}

main()