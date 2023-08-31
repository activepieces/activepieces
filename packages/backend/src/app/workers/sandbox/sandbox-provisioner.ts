import { Sandbox } from '.'
import { sandboxCachePool } from './sandbox-cache-pool'
import { sandboxManager } from './sandbox-manager'
import { pieceManager } from '../../flows/common/piece-installer'
import { engineInstaller } from '../engine/engine-installer'

export const sandboxProvisioner = {
    async provision({ pieces, ...extractCacheKeyParams }: ProvisionParams): Promise<Sandbox> {
        const cacheKey = extractCacheKey(extractCacheKeyParams)
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

const extractCacheKey = ({ type, ...data }: ExtractCacheKeyParams): string => {
    const keyExtractors = {
        [SandBoxProvisionType.ACTION_RUN]: extractActionRunCacheKey,
    }

    return keyExtractors[type](data)
}

const extractActionRunCacheKey = ({ pieceName, pieceVersion }: Omit<ActionRunProvisionParams, 'pieces' | 'type'>): string => {
    return `pieceName-${pieceName}-pieceVersion-${pieceVersion}`
}

type Piece = {
    name: string
    version: string
}

export enum SandBoxProvisionType {
    ACTION_RUN = 'ACTION_RUN',
}

type BaseProvisionParams<T extends SandBoxProvisionType> = {
    type: T
    pieces: Piece[]
}

type ActionRunProvisionParams = BaseProvisionParams<SandBoxProvisionType.ACTION_RUN> & {
    pieceName: string
    pieceVersion: string
}

type ProvisionParams =
    | ActionRunProvisionParams

type ExtractCacheKeyParams = Omit<ProvisionParams, 'pieces'>

type ReleaseParams = {
    sandbox: Sandbox
}
