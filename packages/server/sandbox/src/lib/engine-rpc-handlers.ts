import { isEmpty, isNil } from '@activepieces/core-utils'
import { type ApLogger } from '@activepieces/server-utils'
import { ForceReinstallPieceRequest, WorkerRpcContract } from '@activepieces/shared'
import { pieceInstaller } from './cache/pieces/piece-installer'
import { ProvisionInput, SandboxSettings } from './types'

const FORCE_REINSTALL_COOLDOWN_MS = 5 * 60 * 1000
const lastForceReinstallAt = new Map<string, number>()

export const engineRpcHandlers = ({ log, basePath, getSettings, provision }: EngineRpcHandlersParams): WorkerRpcContract => ({
    async forceReinstallPiece({ pieceName, pieceVersion }: ForceReinstallPieceRequest): Promise<void> {
        const piecesToReinstall = provision.pieces.filter((piece) => piece.pieceName === pieceName && piece.pieceVersion === pieceVersion)
        if (isEmpty(piecesToReinstall)) {
            return
        }
        const cooldownKey = `${pieceName}@${pieceVersion}`
        const lastAttemptAt = lastForceReinstallAt.get(cooldownKey)
        if (!isNil(lastAttemptAt) && Date.now() - lastAttemptAt < FORCE_REINSTALL_COOLDOWN_MS) {
            log.warn({
                piece: { name: pieceName, version: pieceVersion },
            }, '[engineRpcHandlers] Skipping forced piece reinstall, last attempt is within cooldown')
            return
        }
        lastForceReinstallAt.set(cooldownKey, Date.now())
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
