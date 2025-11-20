import { fileSystemUtils } from '@activepieces/server-shared'
import { getPieceNameFromAlias, PiecePackage, unique } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { CodeArtifact } from '../compute/engine-runner-types'
import { workerMachine } from '../utils/machine'
import { codeBuilder } from './code-builder'
import { engineInstaller } from './engine-installer'
import { registryPieceManager } from './pieces/production/registry-piece-manager'
import { GLOBAL_CACHE_COMMON_PATH, GLOBAL_CACHE_PATH_LATEST_VERSION, GLOBAL_CODE_CACHE_PATH } from './worker-cache'

export const executionFiles = (log: FastifyBaseLogger) => ({
    async provision({
        pieces,
        codeSteps,
    }: ProvisionParams): Promise<void> {

        const startTime = performance.now()

        await fileSystemUtils.threadSafeMkdir(GLOBAL_CACHE_PATH_LATEST_VERSION)

        const startTimeCode = performance.now()
        await fileSystemUtils.threadSafeMkdir(GLOBAL_CODE_CACHE_PATH)
        // This is sequential to ensure the worker machine is not overloaded
        for (const artifact of codeSteps) {
            await codeBuilder(log).processCodeStep({
                artifact,
                codesFolderPath: GLOBAL_CODE_CACHE_PATH,
                log,
            })
        }
        log.info({
            path: GLOBAL_CODE_CACHE_PATH,
            timeTaken: `${Math.floor(performance.now() - startTimeCode)}ms`,
        }, 'Installed code in sandbox')

        const startTimeEngine = performance.now()
        const { cacheHit } = await engineInstaller(log).install({
            path: GLOBAL_CACHE_COMMON_PATH,
        })
        log.info({
            path: GLOBAL_CACHE_COMMON_PATH,
            timeTaken: `${Math.floor(performance.now() - startTimeEngine)}ms`,
            cacheHit,
        }, 'Installed engine in sandbox')


        const devPieces = workerMachine.getSettings().DEV_PIECES
        const nonDevPieces = unique(pieces.filter((p) => !devPieces.includes(getPieceNameFromAlias(p.pieceName))))
        if (nonDevPieces.length > 0) {
            const startTime = performance.now()
            await registryPieceManager(log).install({
                pieces: nonDevPieces,
                includeFilters: true,
                broadcast: true,
            })
            log.info({
                pieces: nonDevPieces.map(p => `${p.pieceName}@${p.pieceVersion}`),
                path: GLOBAL_CACHE_COMMON_PATH,
                timeTaken: `${Math.floor(performance.now() - startTime)}ms`,
            }, 'Installed pieces in sandbox')
        }
        log.info({
            timeTaken: `${Math.floor(performance.now() - startTime)}ms`,
        }, 'Sandbox installation complete')

    },

})

type ProvisionParams = {
    pieces: PiecePackage[]
    codeSteps: CodeArtifact[]
}
