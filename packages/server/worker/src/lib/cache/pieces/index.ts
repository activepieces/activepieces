import { PiecesSource } from '@activepieces/server-shared'
import { LocalPieceManager } from './development/local-piece-manager'
import { PieceManager } from './piece-manager'
import { RegistryPieceManager } from './production/registry-piece-manager'

const pieceManagerVariant: Record<PiecesSource, new () => PieceManager> = {
    [PiecesSource.FILE]: LocalPieceManager,
    [PiecesSource.CLOUD_AND_DB]: RegistryPieceManager,
    [PiecesSource.DB]: RegistryPieceManager,
}


const getPieceManager = (source: PiecesSource): PieceManager => {
    return new pieceManagerVariant[source]()
}

export const pieceManager = (source: PiecesSource) => getPieceManager(source)
