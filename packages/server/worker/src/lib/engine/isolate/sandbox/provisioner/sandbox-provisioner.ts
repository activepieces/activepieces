import path from 'path'
import { enrichErrorContext } from '@activepieces/server-shared'
import { PiecePackage, PieceType, RunEnvironment } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { CodeArtifact } from '../../../engine-runner'
import { executionFiles } from '../../../execution-files'
import { IsolateSandbox } from '../isolate-sandbox'
import { sandboxManager } from '../sandbox-manager'

const globalCachePath = path.resolve('cache', 'ns')
const globalCodesPath = path.resolve('cache', 'codes')

export const sandboxProvisioner = (log: FastifyBaseLogger) => ({
    async provision({
        customPiecesPathKey,
        pieces = [],
        codeSteps = [],
        runEnvironment,
        ...cacheInfo
    }: ProvisionParams): Promise<IsolateSandbox> {
        try {


            const customPiecesPath = path.resolve('cache', 'custom', customPiecesPathKey)
            await executionFiles(log).provision({
                pieces,
                codeSteps,
                globalCachePath,
                globalCodesPath,
                customPiecesPath,
                runEnvironment,
            })

            const hasAnyCustomPieces = pieces.some((f: PiecePackage) => f.pieceType === PieceType.CUSTOM)
            const sandbox = await sandboxManager(log).allocate()
            const flowVersionId = codeSteps.length > 0 ? codeSteps[0].flowVersionId : undefined
            await sandbox.assignCache({
                globalCachePath,
                globalCodesPath,
                flowVersionId,
                customPiecesPath: hasAnyCustomPieces ? customPiecesPath : undefined,
                log,
            })

            return sandbox
        }
        catch (error) {
            const contextKey = '[SandboxProvisioner#provision]'
            const contextValue = { pieces, codeSteps, cacheInfo }

            const enrichedError = enrichErrorContext({
                error,
                key: contextKey,
                value: contextValue,
            })

            throw enrichedError
        }
    },

    async release({ sandbox }: ReleaseParams): Promise<void> {
        log.debug(
            { boxId: sandbox.boxId },
            '[SandboxProvisioner#release]',
        )

        await sandboxManager(log).release(sandbox.boxId)
    },
})

type ProvisionParams = {
    pieces?: PiecePackage[]
    codeSteps?: CodeArtifact[]
    customPiecesPathKey: string
    runEnvironment?: RunEnvironment
}

type ReleaseParams = {
    sandbox: IsolateSandbox
}
