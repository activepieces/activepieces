import { fileSystemUtils } from '@activepieces/server-utils'
import { getPieceNameFromAlias, PiecePackage, unique, WorkerToApiContract } from '@activepieces/shared'
import { trace } from '@opentelemetry/api'
import { Logger } from 'pino'
import { workerSettings } from '../config/worker-settings'
import { GLOBAL_CACHE_COMMON_PATH, GLOBAL_CACHE_PATH_LATEST_VERSION, GLOBAL_CODE_CACHE_PATH } from './cache-paths'
import { CodeArtifact, codeBuilder } from './code/code-builder'
import { engineInstaller } from './engine/engine-installer'
import { pieceInstaller } from './pieces/piece-installer'

const tracer = trace.getTracer('provisioner')

export const provisioner = (log: Logger, apiClient: WorkerToApiContract) => ({
    async provision({
        pieces,
        codeSteps,
    }: ProvisionParams): Promise<void> {
        await tracer.startActiveSpan('provisioner.provision', async (span) => {
            try {
                await fileSystemUtils.threadSafeMkdir(GLOBAL_CACHE_PATH_LATEST_VERSION)

                await tracer.startActiveSpan('provisioner.installCode', async (codeSpan) => {
                    try {
                        codeSpan.setAttribute('code.path', GLOBAL_CODE_CACHE_PATH)
                        await fileSystemUtils.threadSafeMkdir(GLOBAL_CODE_CACHE_PATH)
                        for (const artifact of codeSteps) {
                            await codeBuilder(log).processCodeStep({
                                artifact,
                                codesFolderPath: GLOBAL_CODE_CACHE_PATH,
                            })
                        }
                        log.info({ path: GLOBAL_CODE_CACHE_PATH }, 'Installed code in sandbox')
                    }
                    finally {
                        codeSpan.end()
                    }
                })

                await tracer.startActiveSpan('provisioner.installEngine', async (engineSpan) => {
                    try {
                        engineSpan.setAttribute('engine.path', GLOBAL_CACHE_COMMON_PATH)
                        const { cacheHit } = await engineInstaller(log).install({
                            path: GLOBAL_CACHE_COMMON_PATH,
                        })
                        engineSpan.setAttribute('engine.cacheHit', cacheHit)
                        log.info({ path: GLOBAL_CACHE_COMMON_PATH, cacheHit }, 'Installed engine in sandbox')
                    }
                    finally {
                        engineSpan.end()
                    }
                })

                const devPieces = workerSettings.getSettings().DEV_PIECES
                const nonDevPieces = unique(pieces.filter((p) => !devPieces.includes(getPieceNameFromAlias(p.pieceName))))
                if (nonDevPieces.length > 0) {
                    await tracer.startActiveSpan('provisioner.installPieces', async (piecesSpan) => {
                        try {
                            piecesSpan.setAttribute('pieces.count', nonDevPieces.length)
                            await pieceInstaller(log, apiClient).install({
                                pieces: nonDevPieces,
                                includeFilters: true,
                            })
                            log.info({
                                pieces: nonDevPieces.map(p => `${p.pieceName}@${p.pieceVersion}`),
                                path: GLOBAL_CACHE_COMMON_PATH,
                            }, 'Installed pieces in sandbox')
                        }
                        finally {
                            piecesSpan.end()
                        }
                    })
                }
                log.info('Sandbox installation complete')
            }
            finally {
                span.end()
            }
        })
    },
})

type ProvisionParams = {
    pieces: PiecePackage[]
    codeSteps: CodeArtifact[]
}
