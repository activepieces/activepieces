import { publishNpmPackage } from '../utils/publish-npm-package'
import { findAllPiecesDirectoryInSource } from '../utils/piece-script-utils'
import { chunk } from '../../../packages/shared/src/lib/common/utils/utils'

const publishPiece = async (path: string): Promise<void> => {
  await publishNpmPackage(path)
}

const main = async () => {
  const piecesSource = await findAllPiecesDirectoryInSource()
  const piecesSourceChunks = chunk(piecesSource, 30)

  for (const chunk of piecesSourceChunks) {
    await Promise.all(chunk.map(publishPiece))
    await new Promise(resolve => setTimeout(resolve, 5000))
  }
}

main()