import { publishNxProject } from '../utils/publish-nx-project'
import { findAllPieces } from '../utils/piece-script-utils'

const publishPiece = async (nxProjectPath: string, pieceName: string): Promise<void> => {
  console.info(`[publishPiece] pieceName=${pieceName}`)
  await publishNxProject(nxProjectPath)
}

const main = async () => {
  const pieceNames = await findAllPieces()
  const publishResults = pieceNames.map(p => publishPiece(p.directoryName!, p.name))
  await Promise.all(publishResults)
}

main()
