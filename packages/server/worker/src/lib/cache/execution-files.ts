import path from 'path'
import { fileSystemUtils, PiecesSource } from '@activepieces/server-shared'
import { ExecutionMode, PiecePackage, PieceType } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { pieceManager } from '../piece-manager'
import { CodeArtifact } from '../runner/engine-runner-types'
import { workerMachine } from '../utils/machine'
import { codeBuilder } from './code-builder'
import { engineInstaller } from './engine-installer'
import { GLOBAL_CACHE_COMMON_PATH, GLOBAL_CACHE_PATH_LATEST_VERSION, GLOBAL_CODE_CACHE_PATH } from './worker-cache'

export const executionFiles = (log: FastifyBaseLogger) => ({

    getCustomPiecesPath(params: { projectId: string } | { platformId: string }): string {
        if (workerMachine.getSettings().EXECUTION_MODE === ExecutionMode.SANDBOXED) {
            if ('projectId' in params) {
                return path.resolve(GLOBAL_CACHE_PATH_LATEST_VERSION, 'custom_pieces', params.projectId)
            }
            return path.resolve(GLOBAL_CACHE_PATH_LATEST_VERSION, 'custom_pieces', params.platformId)
        }
        return GLOBAL_CACHE_PATH_LATEST_VERSION
    },
    async provision({
        pieces,
        codeSteps,
        customPiecesPath,
    }: ProvisionParams): Promise<void> {
        const startTime = performance.now()

        const source = workerMachine.getSettings().PIECES_SOURCE as PiecesSource
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

        const officialPieces = pieces.filter(f => f.pieceType === PieceType.OFFICIAL)
        if (officialPieces.length > 0) {
            const startTime = performance.now()
            await pieceManager(source).install({
                projectPath: GLOBAL_CACHE_COMMON_PATH,
                pieces: officialPieces,
                log,
            })
            log.info({
                pieces: officialPieces.map(p => `${p.pieceName}@${p.pieceVersion}`),
                path: GLOBAL_CACHE_COMMON_PATH,
                timeTaken: `${Math.floor(performance.now() - startTime)}ms`,
            }, 'Installed official pieces in sandbox')
        }

        const customPieces = pieces.filter(f => f.pieceType === PieceType.CUSTOM)
        if (customPieces.length > 0) {
            const startTime = performance.now()
            await fileSystemUtils.threadSafeMkdir(customPiecesPath)
            await pieceManager(source).install({
                projectPath: customPiecesPath,
                pieces: customPieces,
                log,
            })
            log.info({
                customPieces: customPieces.map(p => `${p.pieceName}@${p.pieceVersion}`),
                customPiecesPath,
                timeTaken: `${Math.floor(performance.now() - startTime)}ms`,
            }, 'Installed custom pieces in sandbox')
        }

        log.info({
            timeTaken: `${Math.floor(performance.now() - startTime)}ms`,
        }, 'Sandbox installation complete')

    },
})

type ProvisionParams = {
    pieces: PiecePackage[]
    codeSteps: CodeArtifact[]
    customPiecesPath: string
}
