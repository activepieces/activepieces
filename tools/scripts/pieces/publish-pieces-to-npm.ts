import { publishNxProject } from '../utils/publish-nx-project'
import { findAllPiecesDirectoryInSource } from '../utils/piece-script-utils'
import { chunk } from '../../../packages/shared/src/lib/common/utils/utils'

const publishPiece = async (nxProjectPath: string): Promise<void> => {
  console.info(`[publishPiece] nxProjectPath=${nxProjectPath}`)
  await publishNxProject(nxProjectPath)
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