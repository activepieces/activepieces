import { getAvailablePieceNames } from './utils/get-available-piece-names'
import { publishNxProject } from './utils/publish-nx-project'

const publishPiece = async (pieceName: string): Promise<void> => {
  console.info(`[publishPiece] pieceName=${pieceName}`)
  const nxProjectPath = `packages/pieces/${pieceName}`
  await publishNxProject(nxProjectPath)
}

const main = async () => {
  const pieceNames = await getAvailablePieceNames()
  const publishResults = pieceNames.map(p => publishPiece(p))
  await Promise.all(publishResults)
}

main()
