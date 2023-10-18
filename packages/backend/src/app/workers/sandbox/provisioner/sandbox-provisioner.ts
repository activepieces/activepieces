import { Sandbox } from '..'
import { sandboxCachePool } from '../cache/sandbox-cache-pool'
import { sandboxManager } from '../sandbox-manager'
import { FileId, PiecePackage } from '@activepieces/shared'
import { SandBoxCacheType, TypedProvisionCacheInfo } from './sandbox-cache-key'
import { logger } from '../../../helper/logger'
import { enrichErrorContext } from '../../../helper/error-handler'

export const sandboxProvisioner = {
    async provision({ pieces = [], codeArchives = [], ...cacheInfo }: ProvisionParams): Promise<Sandbox> {
        try {
            const cachedSandbox = await sandboxCachePool.findOrCreate(cacheInfo)

            await cachedSandbox.prepare({
                pieces,
                codeArchives,
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
            const contextValue = { pieces, codeArchives, cacheInfo }

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


type CodeArchive = {
    id: FileId
    content: Buffer
}

type ProvisionParams<T extends SandBoxCacheType = SandBoxCacheType> = TypedProvisionCacheInfo<T> & {
    pieces?: PiecePackage[]
    codeArchives?: CodeArchive[]
}

type ReleaseParams = {
    sandbox: Sandbox
}
