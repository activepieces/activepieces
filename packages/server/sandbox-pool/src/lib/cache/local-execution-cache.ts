import { PathLike } from 'node:fs'
import { copyFile, rename } from 'node:fs/promises'
import path, { dirname, join } from 'node:path'
import { tryCatch, unique } from '@activepieces/core-utils'
import { type ApLogger, fileSystemUtils, wideEvent } from '@activepieces/server-utils'
import { ApEnvironment, PiecePackage, WorkerToApiContract } from '@activepieces/shared'
import { nanoid } from 'nanoid'
import { CodeArtifact, SandboxPoolSettings } from '../types'
import { cacheUtils } from './cache-paths'
import { codeBuilder } from './code/code-builder'
import { pieceInstaller } from './pieces/piece-installer'

const engineSourcePath = 'dist/packages/engine/main.js'

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

                await wideEvent.timed({
                    name: 'installEngine',
                    fn: async () => {
                        const engineDestPath = path.resolve(commonPath, 'main.js')
                        const existingEngineFile = await fileSystemUtils.fileExists(engineDestPath)
                        const isDev = getSettings().ENVIRONMENT === ApEnvironment.DEVELOPMENT
                        if (existingEngineFile && !isDev) return

                        await atomicCopy(engineSourcePath, `${commonPath}/main.js`)
                        await atomicCopy(`${engineSourcePath}.map`, path.resolve(commonPath, 'main.js.map'))
                        log.info({ path: commonPath }, 'Installed engine in sandbox')
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

async function atomicCopy(src: PathLike, dest: PathLike): Promise<void> {
    const destDir = dirname(dest.toString())
    const tempPath = join(destDir, `main.temp.${nanoid()}.js`)
    await fileSystemUtils.threadSafeMkdir(destDir)
    await copyFile(src, tempPath)
    await rename(tempPath, dest)
}

type ProvisionParams = {
    pieces: PiecePackage[]
    codeSteps: CodeArtifact[]
}
