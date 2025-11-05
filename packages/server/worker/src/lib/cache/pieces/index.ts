import { FastifyBaseLogger } from 'fastify'
import { workerMachine } from '../../utils/machine'
import { localPieceManager } from './development/local-piece-manager'
import { registryPieceManager } from './production/registry-piece-manager'
import { getPieceNameFromAlias, partition, PiecePackage } from '@activepieces/shared'

type InstallParams = {
    projectPath: string
    pieces: PiecePackage[]
}

export interface PieceManager {
    install: (params: InstallParams) => Promise<void>
    installDependencies: (params: InstallParams) => Promise<void>
}

export const piecesInstaller = async (log: FastifyBaseLogger, installParams: InstallParams) => {
    const devPieces = workerMachine.getSettings().DEV_PIECES || []
    const [filterDevPieces, restPieces] = partition(installParams.pieces, (p) => devPieces.includes(getPieceNameFromAlias(p.pieceName)))

    const promises = []
    if (filterDevPieces.length > 0) {
        promises.push(localPieceManager(log).install(installParams))
    }
    if (restPieces.length > 0) {
        promises.push(registryPieceManager(log).install(installParams))
    }
    await Promise.all(promises)
}