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
        logger.info({
            path: globalCachePath,
        }, 'Installing code in sandbox')
        const buildJobs = codeSteps.map(async (artifact) => {
            return codeBuilder.processCodeStep({
                artifact,
                codesFolderPath: globalCodesPath,
            })
        })
        await Promise.all(buildJobs)

        logger.info({
            path: globalCachePath,
        }, 'Installing engine in sandbox')
        await engineInstaller.install({
            path: globalCachePath,
        })

        const officialPieces = pieces.filter(f => f.pieceType === PieceType.OFFICIAL)
        if (officialPieces.length > 0) {
            logger.info({
                pieces,
                globalCachePath,
            }, 'Installing pieces in sandbox')
            await pieceManager.install({
                projectPath: globalCachePath,
                pieces: officialPieces,
            })
        }

        const customPieces = pieces.filter(f => f.pieceType === PieceType.CUSTOM)
        if (customPieces.length > 0) {
            await threadSafeMkdir(customPiecesPath)
            logger.info({
                customPieces,
                customPiecesPath,
            }, 'Installing custom pieces in sandbox')
            await pieceManager.install({
                projectPath: customPiecesPath,
                pieces: customPieces,
            })
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
