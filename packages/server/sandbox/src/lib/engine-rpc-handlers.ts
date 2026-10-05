import { isEmpty } from '@activepieces/core-utils'
import { type ApLogger } from '@activepieces/server-utils'
import { ForceReinstallPieceRequest, WorkerRpcContract } from '@activepieces/shared'
import { pieceInstaller } from './cache/pieces/piece-installer'
import { ProvisionInput, SandboxSettings } from './types'

export const engineRpcHandlers = ({ log, basePath, getSettings, provision }: EngineRpcHandlersParams): WorkerRpcContract => ({
    async forceReinstallPiece({ pieceName, pieceVersion }: ForceReinstallPieceRequest): Promise<void> {
        const piecesToReinstall = provision.pieces.filter((piece) => piece.pieceName === pieceName && piece.pieceVersion === pieceVersion)
        if (isEmpty(piecesToReinstall)) {
            return
        }
        log.warn({
            piece: { name: pieceName, version: pieceVersion },
        }, '[engineRpcHandlers] Engine failed to require a piece module, forcing piece reinstall')
        await pieceInstaller(log, basePath, getSettings).install({
            pieces: piecesToReinstall,
            includeFilters: true,
            publicApiUrl: provision.publicApiUrl,
            engineToken: provision.engineToken,
            force: true,
        })
    },
})

type EngineRpcHandlersParams = {
    log: ApLogger
    basePath: string
    getSettings: () => SandboxSettings
    provision: ProvisionInput
}
