import { fileSystemUtils } from '@activepieces/server-utils'
import { PiecePackage, tryCatch, unique, WorkerToApiContract } from '@activepieces/shared'
import { trace } from '@opentelemetry/api'
import { Logger } from 'pino'
import { getGlobalCacheCommonPath, getGlobalCachePathLatestVersion, getGlobalCodeCachePath } from './cache-paths'
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
                const cachePathLatestVersion = getGlobalCachePathLatestVersion()
                const codeCachePath = getGlobalCodeCachePath()
                const commonPath = getGlobalCacheCommonPath()

                await fileSystemUtils.threadSafeMkdir(cachePathLatestVersion)

                await tracer.startActiveSpan('provisioner.installCode', async (codeSpan) => {
                    try {
                        codeSpan.setAttribute('code.path', codeCachePath)
                        await fileSystemUtils.threadSafeMkdir(codeCachePath)
                        for (const artifact of codeSteps) {
                            await codeBuilder(log).processCodeStep({
                                artifact,
                                codesFolderPath: codeCachePath,
                            })
                        }
                        log.info({ path: codeCachePath }, 'Installed code in sandbox')
                    }
                    finally {
                        codeSpan.end()
                    }
                })

                await tracer.startActiveSpan('provisioner.installEngine', async (engineSpan) => {
                    try {
                        engineSpan.setAttribute('engine.path', commonPath)
                        const { cacheHit } = await engineInstaller(log).install({
                            path: commonPath,
                        })
                        engineSpan.setAttribute('engine.cacheHit', cacheHit)
                        log.info({ path: commonPath, cacheHit }, 'Installed engine in sandbox')
                    }
                    finally {
                        engineSpan.end()
                    }
                })

                const uniquePieces = unique(pieces)
                if (uniquePieces.length > 0) {
                    await tracer.startActiveSpan('provisioner.installPieces', async (piecesSpan) => {
                        try {
                            piecesSpan.setAttribute('pieces.count', uniquePieces.length)
                            await pieceInstaller(log, apiClient).install({
                                pieces: uniquePieces,
                                includeFilters: true,
                            })
                            void tryCatch(() => apiClient.markPieceAsUsed({ pieces: uniquePieces }))
                            log.info({
                                pieces: uniquePieces.map(p => `${p.pieceName}@${p.pieceVersion}`),
                                path: commonPath,
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
