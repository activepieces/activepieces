import { tryCatch, unique } from '@activepieces/core-utils'
import { type ApLogger, fileSystemUtils, wideEvent } from '@activepieces/server-utils'
import { PiecePackage, WorkerToApiContract } from '@activepieces/shared'
import { CodeArtifact, SandboxPoolSettings } from '../types'
import { cacheUtils } from './cache-paths'
import { codeBuilder } from './code/code-builder'
import { pieceInstaller } from './pieces/piece-installer'

export const localExecutionCache = (log: ApLogger, apiClient: WorkerToApiContract, basePath: string, getSettings: () => SandboxPoolSettings) => ({
    async provision({
        pieces,
        codeSteps,
    }: ProvisionParams): Promise<void> {
        await wideEvent.timed({
            name: 'provision',
            fn: async () => {
                const paths = cacheUtils(basePath)
                const cachePathLatestVersion = paths.getGlobalCachePathLatestVersion()
                const codeCachePath = paths.getGlobalCodeCachePath()
                const commonPath = paths.getGlobalCacheCommonPath()

                await fileSystemUtils.threadSafeMkdir(cachePathLatestVersion)

                await wideEvent.timed({
                    name: 'installCode',
                    fn: async () => {
                        await fileSystemUtils.threadSafeMkdir(codeCachePath)
                        for (const artifact of codeSteps) {
                            await codeBuilder(log, getSettings).processCodeStep({
                                artifact,
                                codesFolderPath: codeCachePath,
                            })
                        }
                        log.info({ path: codeCachePath }, 'Installed code in sandbox')
                    },
                })

                const uniquePieces = unique(pieces)
                if (uniquePieces.length > 0) {
                    await wideEvent.timed({
                        name: 'installPieces',
                        fn: async () => {
                            await pieceInstaller(log, apiClient, basePath, getSettings).install({
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
