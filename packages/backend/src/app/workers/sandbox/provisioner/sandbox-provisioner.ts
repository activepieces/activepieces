import { Sandbox } from '..'
import { sandboxCachePool } from '../cache/sandbox-cache-pool'
import { sandboxManager } from '../sandbox-manager'
import { PiecePackage, SourceCode } from '@activepieces/shared'
import { SandBoxCacheType, TypedProvisionCacheInfo } from './sandbox-cache-key'
import { logger } from '../../../helper/logger'
import { enrichErrorContext } from '../../../helper/error-handler'

export const sandboxProvisioner = {
    async provision({ pieces = [], codeSteps = [], ...cacheInfo }: ProvisionParams): Promise<Sandbox> {
        try {
            const cachedSandbox = await sandboxCachePool.findOrCreate(cacheInfo)

            await cachedSandbox.prepare({
                pieces,
                codeSteps,
            })

            const sandbox = await sandboxManager.allocate()

            await sandbox.assignCache({
                cacheKey: cachedSandbox.key,
                cachePath: cachedSandbox.path(),
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
        logger.debug({ boxId: sandbox.boxId, cacheKey: sandbox.cacheKey }, '[SandboxProvisioner#release]')

        await sandboxManager.release(sandbox.boxId)

        if (sandbox.cacheKey) {
            await sandboxCachePool.release({
                key: sandbox.cacheKey,
            })
        }
    },
}

type CodeArtifact = {
    name: string
    sourceCode: SourceCode
}

type ProvisionParams<T extends SandBoxCacheType = SandBoxCacheType> = TypedProvisionCacheInfo<T> & {
    pieces?: PiecePackage[]
    codeSteps?: CodeArtifact[]
}

type ReleaseParams = {
    sandbox: Sandbox
}
