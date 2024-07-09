import { mkdir } from 'fs/promises'
import { logger, packageManager } from '@activepieces/server-shared'
import { PiecePackage } from '@activepieces/shared'
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
    }: ProvisionParams): Promise<void> {
        const startTime = performance.now()
        await mkdir(globalCachePath, { recursive: true })

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
            globalCachePath,
        }, 'Running flow in sandbox')
        await packageManager.init({
            path: globalCachePath,
        })

        logger.info({
            path: globalCachePath,
        }, 'Installing engine in sandbox')
        await engineInstaller.install({
            path: globalCachePath,
        })

        logger.info({
            pieces,
            globalCachePath,
        }, 'Installing pieces in sandbox')
        await pieceManager.install({
            projectPath: globalCachePath,
            pieces,
        })

        logger.info({
            timeTaken: `${Math.floor(performance.now() - startTime)}ms`,
        }, 'Sandbox Installation complete')
        
    },
}

type ProvisionParams = {
    pieces: PiecePackage[]
    codeSteps: CodeArtifact[]
    globalCachePath: string
    globalCodesPath: string
}
