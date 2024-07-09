import { logger, threadSafeMkdir } from '@activepieces/server-shared'
import { PiecePackage, PieceType } from '@activepieces/shared'
import { pieceManager } from '../piece-manager'
import { codeBuilder } from '../utils/code-builder'
import { engineInstaller } from '../utils/engine-installer'
import { CodeArtifact } from './engine-runner'

export const executionFiles = {
    async provision({
        pieces,
        globalCachePath,
        codeSteps,
        globalCodesPath,
        customPiecesPath,
    }: ProvisionParams): Promise<void> {
        const startTime = performance.now()

        await threadSafeMkdir(globalCachePath)

        const startTimeCode = performance.now()
        const buildJobs = codeSteps.map(async (artifact) => {
            return codeBuilder.processCodeStep({
                artifact,
                codesFolderPath: globalCodesPath,
            })
        })
        await Promise.all(buildJobs)
        logger.info({
            path: globalCachePath,
            timeTaken: `${Math.floor(performance.now() - startTimeCode)}ms`,
        }, 'Installed code in sandbox')

        const startTimeEngine = performance.now()
        await engineInstaller.install({
            path: globalCachePath,
        })
        logger.info({
            path: globalCachePath,
            timeTaken: `${Math.floor(performance.now() - startTimeEngine)}ms`,
        }, 'Installed engine in sandbox')

        const officialPieces = pieces.filter(f => f.pieceType === PieceType.OFFICIAL)
        if (officialPieces.length > 0) {
            const startTime = performance.now()
            await pieceManager.install({
                projectPath: globalCachePath,
                pieces: officialPieces,
            })
            logger.info({
                pieces: officialPieces.map(p => `${p.pieceName}@${p.pieceVersion}`),
                globalCachePath,
                timeTaken: `${Math.floor(performance.now() - startTime)}ms`,
            }, 'Intalled official pieces in sandbox')
        }

        const customPieces = pieces.filter(f => f.pieceType === PieceType.CUSTOM)
        if (customPieces.length > 0) {
            const startTime = performance.now()
            await threadSafeMkdir(customPiecesPath)
            await pieceManager.install({
                projectPath: customPiecesPath,
                pieces: customPieces,
            })
            logger.info({
                customPieces: customPieces.map(p => `${p.pieceName}@${p.pieceVersion}`),
                customPiecesPath,
                timeTaken: `${Math.floor(performance.now() - startTime)}ms`,
            }, 'Installed custom pieces in sandbox')
        }

        logger.info({
            timeTaken: `${Math.floor(performance.now() - startTime)}ms`,
        }, 'Sandbox installation complete')

    },
}

type ProvisionParams = {
    pieces: PiecePackage[]
    codeSteps: CodeArtifact[]
    globalCachePath: string
    globalCodesPath: string
    customPiecesPath: string
}
