import { publishNxProject } from '../utils/publish-nx-project'
import { findAllPieces, findAllPiecesDirectoryInSource } from '../utils/piece-script-utils'

const publishPiece = async (nxProjectPath: string): Promise<void> => {
  console.info(`[publishPiece] nxProjectPath=${nxProjectPath}`)
  await publishNxProject(nxProjectPath)
}

const main = async () => {
  const piecesSource = await findAllPiecesDirectoryInSource()
  const publishResults = piecesSource.map(p => publishPiece(p))
  await Promise.all(publishResults)
}

main()
