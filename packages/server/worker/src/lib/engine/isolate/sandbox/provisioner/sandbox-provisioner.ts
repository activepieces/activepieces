import path from 'path'
import { enrichErrorContext, logger } from '@activepieces/server-shared'
import { PiecePackage, PieceType } from '@activepieces/shared'
import { CodeArtifact } from '../../../engine-runner'
import { executionFiles } from '../../../execution-files'
import { IsolateSandbox } from '../isolate-sandbox'
import { sandboxManager } from '../sandbox-manager'
import { extractProvisionCacheKey, TypedProvisionCacheInfo } from './sandbox-cache-key'

const globalCachePath = path.resolve('cache', 'ns')
const globalCodesPath = path.resolve('cache', 'codes')

export const sandboxProvisioner = {
    async provision({
        customPiecesPathKey,
        pieces = [],
        codeSteps = [],
        ...cacheInfo
    }: ProvisionParams): Promise<IsolateSandbox> {
        try {

            const cacheKey = extractProvisionCacheKey(cacheInfo)

            const customPiecesPath = path.resolve('cache', 'custom', customPiecesPathKey)
            await executionFiles.provision({
                pieces,
                codeSteps,
                globalCachePath,
                globalCodesPath,
                customPiecesPath,
            })

            const hasAnyCustomPieces = pieces.some(f => f.pieceType === PieceType.CUSTOM)
            const sandbox = await sandboxManager.allocate(cacheKey)
            const flowVersionId = codeSteps.length > 0 ? codeSteps[0].flowVersionId : undefined
            await sandbox.assignCache({
                cacheKey,
                globalCachePath,
                globalCodesPath,
                flowVersionId,
                customPiecesPath: hasAnyCustomPieces ? customPiecesPath : undefined,
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
        logger.debug(
            { boxId: sandbox.boxId, cacheKey: sandbox.cacheKey },
            '[SandboxProvisioner#release]',
        )

        await sandboxManager.release(sandbox.boxId)
    },
}

type ProvisionParams = TypedProvisionCacheInfo & {
    pieces?: PiecePackage[]
    codeSteps?: CodeArtifact[]
    customPiecesPathKey: string
}

type ReleaseParams = {
    sandbox: IsolateSandbox
}
