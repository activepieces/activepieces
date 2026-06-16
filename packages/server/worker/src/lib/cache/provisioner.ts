import { type ApLogger, fileSystemUtils, wideEvent } from '@activepieces/server-utils'
import { PiecePackage, tryCatch, unique, WorkerToApiContract } from '@activepieces/shared'
import { getGlobalCacheCommonPath, getGlobalCachePathLatestVersion, getGlobalCodeCachePath } from './cache-paths'
import { CodeArtifact, codeBuilder } from './code/code-builder'
import { engineInstaller } from './engine/engine-installer'
import { pieceInstaller } from './pieces/piece-installer'

export const provisioner = (log: ApLogger, apiClient: WorkerToApiContract) => ({
    async provision({
        pieces,
        codeSteps,
    }: ProvisionParams): Promise<void> {
        await wideEvent.timed({
            name: 'provision',
            fn: async () => {
                const cachePathLatestVersion = getGlobalCachePathLatestVersion()
                const codeCachePath = getGlobalCodeCachePath()
                const commonPath = getGlobalCacheCommonPath()

                await fileSystemUtils.threadSafeMkdir(cachePathLatestVersion)

                await wideEvent.timed({
                    name: 'installCode',
                    fn: async () => {
                        await fileSystemUtils.threadSafeMkdir(codeCachePath)
                        for (const artifact of codeSteps) {
                            await codeBuilder(log).processCodeStep({
                                artifact,
                                codesFolderPath: codeCachePath,
                            })
                        }
                        log.info({ path: codeCachePath }, 'Installed code in sandbox')
                    },
                })

                await wideEvent.timed({
                    name: 'installEngine',
                    fn: async () => {
                        const { cacheHit } = await engineInstaller(log).install({
                            path: commonPath,
                        })
                        log.info({ path: commonPath, cacheHit }, 'Installed engine in sandbox')
                    },
                })

                const uniquePieces = unique(pieces)
                if (uniquePieces.length > 0) {
                    await wideEvent.timed({
                        name: 'installPieces',
                        fn: async () => {
                            await pieceInstaller(log, apiClient).install({
                                pieces: uniquePieces,
                                includeFilters: true,
                            })
                            void tryCatch(() => apiClient.markPieceAsUsed({ pieces: uniquePieces }))
                            log.info({
                                pieces: uniquePieces.map(p => `${p.pieceName}@${p.pieceVersion}`),
                                path: commonPath,
                            }, 'Installed pieces in sandbox')
                        },
                    })
                }
                log.info('Sandbox installation complete')
            },
        })
    },
})

type ProvisionParams = {
    pieces: PiecePackage[]
    codeSteps: CodeArtifact[]
}
