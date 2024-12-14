import path from 'path'
import { enrichErrorContext } from '@activepieces/server-shared'
import { PiecePackage, PieceType } from '@activepieces/shared'
import { CodeArtifact } from '../../../engine-runner'
import { executionFiles } from '../../../execution-files'
import { IsolateSandbox } from '../isolate-sandbox'
import { sandboxManager } from '../sandbox-manager'
import { extractProvisionCacheKey, TypedProvisionCacheInfo } from './sandbox-cache-key'
import { FastifyBaseLogger } from 'fastify'

const globalCachePath = path.resolve('cache', 'ns')
const globalCodesPath = path.resolve('cache', 'codes')

export const sandboxProvisioner = (log: FastifyBaseLogger) => ({
    async provision({
        customPiecesPathKey,
        pieces = [],
        codeSteps = [],
        ...cacheInfo
    }: ProvisionParams): Promise<IsolateSandbox> {
        try {

            const cacheKey = extractProvisionCacheKey(cacheInfo)

            const customPiecesPath = path.resolve('cache', 'custom', customPiecesPathKey)
            await executionFiles(log).provision({
                pieces,
                codeSteps,
                globalCachePath,
                globalCodesPath,
                customPiecesPath,
            })

            const hasAnyCustomPieces = pieces.some(f => f.pieceType === PieceType.CUSTOM)
            const sandbox = await sandboxManager(log).allocate(cacheKey)
            const flowVersionId = codeSteps.length > 0 ? codeSteps[0].flowVersionId : undefined
            await sandbox.assignCache({
                cacheKey,
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
            { boxId: sandbox.boxId, cacheKey: sandbox.cacheKey },
            '[SandboxProvisioner#release]',
        )

        await sandboxManager(log).release(sandbox.boxId)
    },
})

type ProvisionParams = TypedProvisionCacheInfo & {
    pieces?: PiecePackage[]
    codeSteps?: CodeArtifact[]
    customPiecesPathKey: string
}

type ReleaseParams = {
    sandbox: IsolateSandbox
}
