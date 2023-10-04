import { Sandbox } from '..'
import { sandboxCachePool } from '../cache/sandbox-cache-pool'
import { sandboxManager } from '../sandbox-manager'
import { FileId } from '@activepieces/shared'
import { SandBoxCacheType, TypedProvisionCacheInfo } from './sandbox-cache-key'
import { logger } from '../../../helper/logger'

export const sandboxProvisioner = {
    async provision({ pieces = [], codeArchives = [], ...cacheInfo }: ProvisionParams): Promise<Sandbox> {

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

type ProvisionParams<T extends SandBoxCacheType = SandBoxCacheType> = TypedProvisionCacheInfo<T> & {
    pieces?: Piece[]
    codeArchives?: CodeArchive[]
}


type Piece = {
    name: string
    version: string
}

type CodeArchive = {
    id: FileId
    content: Buffer
}

type ReleaseParams = {
    sandbox: Sandbox
}
