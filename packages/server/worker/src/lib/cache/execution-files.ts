import path from 'path'
import { GLOBAL_CACHE_COMMON_PATH, GLOBAL_CACHE_PATH, GLOBAL_CODE_CACHE_PATH, PiecesSource, threadSafeMkdir } from '@activepieces/server-shared'
import { assertNotNullOrUndefined, ExecutionMode, PiecePackage, PieceType, RunEnvironment } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { pieceManager } from '../piece-manager'
import { CodeArtifact } from '../runner/engine-runner-types'
import { workerMachine } from '../utils/machine'
import { codeBuilder } from './code-builder'
import { engineInstaller } from './engine-installer'

export const executionFiles = (log: FastifyBaseLogger) => ({

    getCustomPiecesPath(params: { projectId: string } | { platformId: string }): string {
        if (workerMachine.getSettings().EXECUTION_MODE === ExecutionMode.SANDBOXED) {
            if ('projectId' in params) {
                return path.resolve(GLOBAL_CACHE_PATH, 'custom_pieces', params.projectId)
            }
            return path.resolve(GLOBAL_CACHE_PATH, 'custom_pieces', params.platformId)
        }
        return GLOBAL_CACHE_PATH
    },
    async provision({
        pieces,
        codeSteps,
        customPiecesPath,
        runEnvironment,
    }: ProvisionParams): Promise<void> {
        const startTime = performance.now()

        const source = workerMachine.getSettings().PIECES_SOURCE as PiecesSource
        await threadSafeMkdir(GLOBAL_CACHE_PATH)

        const startTimeCode = performance.now()
        await threadSafeMkdir(GLOBAL_CODE_CACHE_PATH)
        const buildJobs = codeSteps.map(async (artifact) => {
            assertNotNullOrUndefined(runEnvironment, 'Run environment is required')
            return codeBuilder(log).processCodeStep({
                artifact,
                codesFolderPath: GLOBAL_CODE_CACHE_PATH,
                runEnvironment,
                log,
            })
        })
        await Promise.all(buildJobs)
        log.info({
            path: GLOBAL_CODE_CACHE_PATH,
            timeTaken: `${Math.floor(performance.now() - startTimeCode)}ms`,
        }, 'Installed code in sandbox')

        const startTimeEngine = performance.now()
        await engineInstaller(log).install({
            path: GLOBAL_CACHE_COMMON_PATH,
        })
        log.info({
            path: GLOBAL_CACHE_COMMON_PATH,
            timeTaken: `${Math.floor(performance.now() - startTimeEngine)}ms`,
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
            await threadSafeMkdir(customPiecesPath)
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
    runEnvironment?: RunEnvironment
}
