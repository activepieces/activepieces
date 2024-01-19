import { publishNxProject } from '../utils/publish-nx-project'
import { findAllPieces, findPiece, getSourceDirectory } from '../utils/piece-script-utils'

const publishPiece = async (nxProjectPath: string, pieceName: string): Promise<void> => {
  console.info(`[publishPiece] pieceName=${pieceName}`)
  await publishNxProject(nxProjectPath)
}

const main = async () => {
  const piecesDirectory = await findAllPieces()
  const publishResults = piecesDirectory.map(p => publishPiece(getSourceDirectory(p.directoryPath!), p.name))
  await Promise.all(publishResults)
}

main()
