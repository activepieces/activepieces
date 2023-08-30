import { apId } from '@activepieces/shared'
import { Sandbox } from '.'
import { sandboxCachePool } from './sandbox-cache-pool'
import { sandboxManager } from './sandbox-manager'
import { pieceManager } from '../../flows/common/piece-installer'
import { engineInstaller } from '../engine/engine-installer'

export const sandboxProvisioner = {
    async provision({ pieces }: ProvisionParams): Promise<Sandbox> {
        const cacheKey = extractCacheKey()
        const cachedSandbox = await sandboxCachePool.getByKey(cacheKey)

        await pieceManager.install({
            projectPath: cachedSandbox.path(),
            pieces,
        })

        await engineInstaller.install({
            path: cachedSandbox.path(),
        })

        const sandbox = await sandboxManager.obtainSandbox()
        await sandbox.useCache(cachedSandbox.path())
        return sandbox
    },

    async release({ sandbox }: ReleaseParams): Promise<void> {
        await sandboxManager.returnSandbox(sandbox.boxId)
    },
}

const extractCacheKey = (): string => {
    return apId()
}

type Piece = {
    name: string
    version: string
}

type ProvisionParams = {
    pieces: Piece[]
}

type ReleaseParams = {
    sandbox: Sandbox
}
