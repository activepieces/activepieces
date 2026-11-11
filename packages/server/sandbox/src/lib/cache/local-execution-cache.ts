import { unique } from '@activepieces/core-utils'
import { type ApLogger, fileSystemUtils, wideEvent } from '@activepieces/server-utils'
import { PiecePackage } from '@activepieces/shared'
import { CodeArtifact, SandboxSettings } from '../types'
import { cacheUtils } from './cache-paths'
import { actionRunCache, codeCacheEviction } from './code-cache-eviction'
import { engineInstaller } from './engine/engine-installer'
import { codeBuilder } from './flow/code/code-builder'
import { codeCache } from './flow/code/code-cache'
import { pieceInstaller } from './pieces/piece-installer'

export const localExecutionCache = (log: ApLogger, basePath: string, getSettings: () => SandboxSettings) => ({
    async provision({
        pieces,
        codeSteps,
        internalApiUrl,
        engineToken,
        bestEffort,
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
                            await installCodeStep({ artifact, codeCachePath, basePath, log, getSettings })
                        }
                        log.info({ path: codeCachePath }, 'Installed code in sandbox')
                    },
                })

                await wideEvent.timed({
                    name: 'installEngine',
                    fn: async () => {
                        const { cacheHit } = await engineInstaller(log, getSettings).install({
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
                            await pieceInstaller(log, basePath, getSettings).install({
                                pieces: uniquePieces,
                                includeFilters: true,
                                internalApiUrl,
                                engineToken,
                                bestEffort,
                            })
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

async function installCodeStep({ artifact, codeCachePath, basePath, log, getSettings }: InstallCodeStepParams): Promise<void> {
    const codes = codeCache(codeCachePath)
    const isActionRun = actionRunCache.isActionRunNamespace(artifact.flowVersionId)
    const dirPath = isActionRun
        ? codes.flowVersionDir(artifact.flowVersionId)
        : codes.stepDir({ flowVersionId: artifact.flowVersionId, stepName: artifact.name })
    await codeCacheEviction.withDirLock({
        basePath,
        dirPath,
        fn: async () => {
            await codeBuilder(log, getSettings).processCodeStep({
                artifact,
                codesFolderPath: codeCachePath,
            })
            await codeCacheEviction.markUsed(dirPath)
        },
    })
}

type InstallCodeStepParams = {
    artifact: CodeArtifact
    codeCachePath: string
    basePath: string
    log: ApLogger
    getSettings: () => SandboxSettings
}

type ProvisionParams = {
    pieces: PiecePackage[]
    codeSteps: CodeArtifact[]
    internalApiUrl: string
    engineToken: string
    bestEffort?: boolean
}
