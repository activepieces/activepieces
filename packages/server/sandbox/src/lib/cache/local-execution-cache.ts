import { unique } from '@activepieces/core-utils'
import { type ApLogger, fileSystemUtils, wideEvent } from '@activepieces/server-utils'
import { PiecePackage } from '@activepieces/shared'
import { CodeArtifact, SandboxSettings } from '../types'
import { actionRunCache } from './action-run-cache'
import { cacheUtils } from './cache-paths'
import { engineInstaller } from './engine/engine-installer'
import { codeBuilder } from './flow/code/code-builder'
import { codeCache } from './flow/code/code-cache'
import { pieceInstaller } from './pieces/piece-installer'

export const localExecutionCache = (log: ApLogger, basePath: string, getSettings: () => SandboxSettings) => ({
    async provision({
        pieces,
        codeSteps,
        publicApiUrl,
        engineToken,
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
                            await installCodeStep({ artifact, codeCachePath, log, getSettings })
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
                                publicApiUrl,
                                engineToken,
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

async function installCodeStep({ artifact, codeCachePath, log, getSettings }: InstallCodeStepParams): Promise<void> {
    const build = async (): Promise<void> => {
        await codeBuilder(log, getSettings).processCodeStep({
            artifact,
            codesFolderPath: codeCachePath,
        })
    }
    if (!actionRunCache.isActionRunNamespace(artifact.flowVersionId)) {
        await build()
        return
    }
    const dirPath = codeCache(codeCachePath).flowVersionDir(artifact.flowVersionId)
    do {
        await build()
        await actionRunCache.touch(dirPath)
    } while (await sweptWhileProvisioning({ dirPath, log }))
}

async function sweptWhileProvisioning({ dirPath, log }: SweptWhileProvisioningParams): Promise<boolean> {
    const swept = await actionRunCache.settlePendingRemoval(dirPath)
    if (swept) {
        log.warn({ cache: { path: dirPath } }, 'Action-run code cache was swept while provisioning, rebuilding')
    }
    return swept
}

type SweptWhileProvisioningParams = {
    dirPath: string
    log: ApLogger
}

type InstallCodeStepParams = {
    artifact: CodeArtifact
    codeCachePath: string
    log: ApLogger
    getSettings: () => SandboxSettings
}

type ProvisionParams = {
    pieces: PiecePackage[]
    codeSteps: CodeArtifact[]
    publicApiUrl: string
    engineToken: string
}
