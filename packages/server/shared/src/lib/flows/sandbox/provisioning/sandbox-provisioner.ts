import { PiecePackage, SourceCode } from '@activepieces/shared'
import { enrichErrorContext } from '../../../exception-handler'
import { logger } from '../../../logger'
import { sandboxCachePool } from '../caching/sandbox-cache-pool'
import { Sandbox } from '../core'
import { sandboxManager } from '../sandbox-manager'
import { ProvisionCacheInfo, SandBoxCacheType } from './sandbox-cache-key'

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
        logger.debug({ name: 'SandboxProvisioner#release', boxId: sandbox.boxId, cacheKey: sandbox.cacheKey })

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

type ProvisionParams<T extends SandBoxCacheType = SandBoxCacheType> = ProvisionCacheInfo<T> & {
    pieces?: PiecePackage[]
    codeSteps?: CodeArtifact[]
}

type ReleaseParams = {
    sandbox: Sandbox
}
