import { unique } from '@activepieces/core-utils'
import { type ApLogger, fileSystemUtils, wideEvent } from '@activepieces/server-utils'
import { PiecePackage } from '@activepieces/shared'
import { CodeArtifact, SandboxSettings } from '../types'
import { actionRunCache } from './action-run-cache'
import { cacheUtils } from './cache-paths'
import { engineInstaller } from './engine/engine-installer'
import { codeBuilder } from './flow/code/code-builder'
import { codeCache } from './flow/code/code-cache'
import { pendingCacheRemovals } from './pending-cache-removals'
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

async function installCodeStep({ artifact, codeCachePath, log, getSettings }: InstallCodeStepParams): Promise<void> {
    const build = async (): Promise<void> => {
        await codeBuilder(log, getSettings).processCodeStep({
            artifact,
            codesFolderPath: codeCachePath,
        })
    }
    // Loops because a build can land on a directory an eviction sweep (action-run-cache.ts,
    // code-cache-eviction.ts) is mid-removal of — waiting for that removal and rebuilding is the
    // only way to avoid running against partially-deleted files. action-run-cache.ts evicts a whole
    // namespace dir at once, but code-cache-eviction.ts now evicts per step dir (code-builder.ts
    // touches that one on every use) — wait on whichever one actually gets deleted.
    const codes = codeCache(codeCachePath)
    const isActionRun = actionRunCache.isActionRunNamespace(artifact.flowVersionId)
    const dirPath = isActionRun
        ? codes.flowVersionDir(artifact.flowVersionId)
        : codes.stepDir({ flowVersionId: artifact.flowVersionId, stepName: artifact.name })
    do {
        await build()
        if (isActionRun) {
            // code-builder.ts only touches the nested step dir it writes to, which never bumps a
            // parent directory's own mtime — action-run-cache.ts's sweep needs the namespace dir
            // itself touched on every use, not just its first build.
            await actionRunCache.touch(dirPath)
        }
    } while (await sweptWhileProvisioning({ dirPath, log }))
}

async function sweptWhileProvisioning({ dirPath, log }: SweptWhileProvisioningParams): Promise<boolean> {
    const swept = await pendingCacheRemovals.settle(dirPath)
    if (swept) {
        log.warn({ cache: { path: dirPath } }, 'Code cache was swept while provisioning, rebuilding')
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
    internalApiUrl: string
    engineToken: string
    bestEffort?: boolean
}
