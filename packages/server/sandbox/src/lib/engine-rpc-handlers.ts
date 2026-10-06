import { join } from 'path'
import { isEmpty } from '@activepieces/core-utils'
import { type ApLogger } from '@activepieces/server-utils'
import { ForceReinstallPieceRequest, WorkerRpcContract } from '@activepieces/shared'
import { pieceInstaller } from './cache/pieces/piece-installer'
import { ProvisionInput, SandboxSettings } from './types'
import { distributedDiskLock } from './utils/distributed-lock'

const FORCE_REINSTALL_COOLDOWN_MS = 2 * 60 * 1000
const FORCE_REINSTALL_LOCK_TIMEOUT_MS = 60 * 1000

export const engineRpcHandlers = ({ log, basePath, getSettings, provision }: EngineRpcHandlersParams): WorkerRpcContract => ({
    async forceReinstallPiece({ pieceName, pieceVersion }: ForceReinstallPieceRequest): Promise<void> {
        const piecesToReinstall = provision.pieces.filter((piece) => piece.pieceName === pieceName && piece.pieceVersion === pieceVersion)
        if (isEmpty(piecesToReinstall)) {
            return
        }
        const ran = await distributedDiskLock(join(basePath, 'locks')).runExclusiveWithCooldown({
            key: `force-reinstall-${pieceName}@${pieceVersion}`,
            timeoutMs: FORCE_REINSTALL_LOCK_TIMEOUT_MS,
            cooldownMs: FORCE_REINSTALL_COOLDOWN_MS,
            fn: async () => {
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
        if (!ran) {
            log.warn({
                piece: { name: pieceName, version: pieceVersion },
            }, '[engineRpcHandlers] Skipping forced piece reinstall, last attempt is within cooldown')
        }
    },
})

type EngineRpcHandlersParams = {
    log: ApLogger
    basePath: string
    getSettings: () => SandboxSettings
    provision: ProvisionInput
}
