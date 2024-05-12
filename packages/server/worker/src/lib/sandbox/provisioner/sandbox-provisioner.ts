import { enrichErrorContext, logger } from '@activepieces/server-shared'
import { PiecePackage, SourceCode } from '@activepieces/shared'
import { sandboxCachePool } from '../files/sandbox-cache-pool'
import { Sandbox } from '../index'
import { sandboxManager } from '../sandbox-manager'
import { SandBoxCacheType, TypedProvisionCacheInfo } from './sandbox-cache-key'

export const sandboxProvisioner = {
    async provision({
        pieces = [],
        codeSteps = [],
        ...cacheInfo
    }: ProvisionParams): Promise<Sandbox> {
        try {
            const cachedSandbox = await sandboxCachePool.findOrCreate(cacheInfo)

            await cachedSandbox.prepare({
                pieces,
                codeSteps,
            })

            const sandbox = await sandboxManager.allocate(cachedSandbox.key)

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
        logger.debug(
            { boxId: sandbox.boxId, cacheKey: sandbox.cacheKey },
            '[SandboxProvisioner#release]',
        )

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

type ProvisionParams<T extends SandBoxCacheType = SandBoxCacheType> =
  TypedProvisionCacheInfo<T> & {
      pieces?: PiecePackage[]
      codeSteps?: CodeArtifact[]
  }

type ReleaseParams = {
    sandbox: Sandbox
}
