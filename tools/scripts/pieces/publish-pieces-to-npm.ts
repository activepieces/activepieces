import { publishNxProject } from '../utils/publish-nx-project'
import { findAllPiecesDirectoryInSource, findAllPremiumPiecesDirectory } from '../utils/piece-script-utils'

const publishPiece = async (nxProjectPath: string): Promise<void> => {
  console.info(`[publishPiece] nxProjectPath=${nxProjectPath}`)
  await publishNxProject(nxProjectPath)
}

const main = async () => {
  const piecesSource = await findAllPiecesDirectoryInSource()
  const enterprisePiecesSource = await findAllPremiumPiecesDirectory()
  const publishResults = [...piecesSource, ...enterprisePiecesSource].map(p => publishPiece(p))
  await Promise.all(publishResults)
}

main()
