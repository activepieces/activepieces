import { stat, writeFile } from 'node:fs/promises'
import { dirname, join } from 'path'
import { isEmpty, tryCatch } from '@activepieces/core-utils'
import { type ApLogger, fileSystemUtils } from '@activepieces/server-utils'
import { ForceReinstallPieceRequest, WorkerRpcContract } from '@activepieces/shared'
import { pieceInstaller } from './cache/pieces/piece-installer'
import { ProvisionInput, SandboxSettings } from './types'
import { diskLock } from './utils/distributed-lock'

const FORCE_REINSTALL_COOLDOWN_MS = 2 * 60 * 1000
const FORCE_REINSTALL_LOCK_TIMEOUT_MS = 60 * 1000

export const engineRpcHandlers = ({ log, basePath, getSettings, provision }: EngineRpcHandlersParams): WorkerRpcContract => ({
    async forceReinstallPiece({ pieceName, pieceVersion }: ForceReinstallPieceRequest): Promise<void> {
        const piecesToReinstall = provision.pieces.filter((piece) => piece.pieceName === pieceName && piece.pieceVersion === pieceVersion)
        if (isEmpty(piecesToReinstall)) {
            return
        }
        const pieceKey = `${pieceName}@${pieceVersion}`
        const installer = pieceInstaller(log, basePath, getSettings)
        await diskLock(join(basePath, 'force-install-lock')).runExclusive({
            key: installer.resolveWorkspace(piecesToReinstall[0]),
            timeoutMs: FORCE_REINSTALL_LOCK_TIMEOUT_MS,
            fn: async () => {
                const stampPath = reinstallStampPath(basePath, pieceKey)
                if (await isWithinCooldown(stampPath)) {
                    log.warn({
                        piece: { name: pieceName, version: pieceVersion },
                    }, '[engineRpcHandlers] Skipping forced piece reinstall, last attempt is within cooldown')
                    return
                }
                await markReinstallAttempt(stampPath)
                log.warn({
                    piece: { name: pieceName, version: pieceVersion },
                }, '[engineRpcHandlers] Engine failed to require a piece module, forcing piece reinstall')
                await installer.install({
                    pieces: piecesToReinstall,
                    includeFilters: true,
                    publicApiUrl: provision.publicApiUrl,
                    engineToken: provision.engineToken,
                    force: true,
                })
            },
        })
    },
})

function reinstallStampPath(basePath: string, pieceKey: string): string {
    return join(basePath, 'force-reinstall', pieceKey.replace(/[^a-zA-Z0-9._-]/g, '-'))
}

async function isWithinCooldown(stampPath: string): Promise<boolean> {
    const { data: stampStat, error } = await tryCatch(() => stat(stampPath))
    if (error) {
        return false
    }
    return Date.now() - stampStat.mtimeMs < FORCE_REINSTALL_COOLDOWN_MS
}

async function markReinstallAttempt(stampPath: string): Promise<void> {
    await fileSystemUtils.threadSafeMkdir(dirname(stampPath))
    await writeFile(stampPath, '', 'utf8')
}

type EngineRpcHandlersParams = {
    log: ApLogger
    basePath: string
    getSettings: () => SandboxSettings
    provision: ProvisionInput
}
