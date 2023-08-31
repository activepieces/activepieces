import { Sandbox } from '..'
import { CachedSandbox, CachedSandboxState, sandboxCachePool } from '../sandbox-cache-pool'
import { sandboxManager } from '../sandbox-manager'
import { pieceManager } from '../../../flows/common/piece-installer'
import { engineInstaller } from '../../engine/engine-installer'
import { FileId, FlowVersionId, apId } from '@activepieces/shared'
import { SandBoxCacheType } from './sandbox-cache-type'

export const sandboxProvisioner = {
    async provision({ pieces = [], ...cacheInfo }: ProvisionParams): Promise<Sandbox> {
        const cacheKey = extractCacheKey(cacheInfo)
        const cachedSandbox = await sandboxCachePool.getByKey(cacheKey)

        await prepareCachedSandbox({
            type: cacheInfo.type,
            cachedSandbox,
            pieces,
        })

        const sandbox = await sandboxManager.allocate()
        await sandbox.useCache(cachedSandbox.path())
        return sandbox
    },

    async release({ sandbox }: ReleaseParams): Promise<void> {
        await sandboxManager.release(sandbox.boxId)
    },
}

const extractCacheKey = (params: ProvisionCacheInfo): string => {
    switch (params.type) {
        case SandBoxCacheType.CODE:
            return extractCodeCacheKey(params)
        case SandBoxCacheType.FLOW:
            return extractFlowCacheKey(params)
        case SandBoxCacheType.NONE:
            return extractNoneCacheKey(params)
        case SandBoxCacheType.PIECE:
            return extractPieceCacheKey(params)
    }
}

const extractCodeCacheKey = ({ artifactSourceId }: CodeProvisionCacheInfo): string => {
    return `artifactSourceId-${artifactSourceId}`
}

const extractFlowCacheKey = ({ flowVersionId }: FlowProvisionCacheInfo): string => {
    return `flowVersionId-${flowVersionId}`
}

const extractNoneCacheKey = (_params: NoneProvisionCacheInfo): string => {
    return `apId-${apId}`
}

const extractPieceCacheKey = ({ pieceName, pieceVersion }: PieceProvisionCacheInfo): string => {
    return `pieceName-${pieceName}-pieceVersion-${pieceVersion}`
}

const prepareCachedSandbox = async ({ type, cachedSandbox, pieces }: PrepareCachedSandboxParams): Promise<void> => {
    if (cachedSandbox.state === CachedSandboxState.READY) {
        return
    }

    if (cachedSandbox.state !== CachedSandboxState.INITIALIZED) {
        throw new Error(`[SandboxProvisioner#prepareCachedSandbox] cachedSandboxKey=${cachedSandbox.key} state=${cachedSandbox.state}`)
    }

    const path = cachedSandbox.path()

    await pieceManager.install({
        projectPath: path,
        pieces,
    })

    await installEngine({
        type,
        path,
    })
}

const installEngine = async ({ type, path }: InstallEngineParams): Promise<void> => {
    if (type !== SandBoxCacheType.CODE) {
        await engineInstaller.install({
            path,
        })
    }
}

type Piece = {
    name: string
    version: string
}

type BaseProvisionCacheInfo<T extends SandBoxCacheType> = {
    type: T
}

type CodeProvisionCacheInfo = BaseProvisionCacheInfo<SandBoxCacheType.CODE> & {
    artifactSourceId: FileId
}

type FlowProvisionCacheInfo = BaseProvisionCacheInfo<SandBoxCacheType.FLOW> & {
    flowVersionId: FlowVersionId
}

type NoneProvisionCacheInfo = BaseProvisionCacheInfo<SandBoxCacheType.NONE>

type PieceProvisionCacheInfo = BaseProvisionCacheInfo<SandBoxCacheType.PIECE> & {
    pieceName: string
    pieceVersion: string
}

type ProvisionCacheInfo<T extends SandBoxCacheType = SandBoxCacheType> =
    T extends SandBoxCacheType.CODE
        ? CodeProvisionCacheInfo
        : T extends SandBoxCacheType.FLOW
            ? FlowProvisionCacheInfo
            : T extends SandBoxCacheType.NONE
                ? NoneProvisionCacheInfo
                : T extends SandBoxCacheType.PIECE
                    ? PieceProvisionCacheInfo
                    : never

type ProvisionParams<T extends SandBoxCacheType = SandBoxCacheType> = ProvisionCacheInfo<T> & {
    pieces?: Piece[]
}

type ReleaseParams = {
    sandbox: Sandbox
}

type PrepareCachedSandboxParams = {
    type: SandBoxCacheType
    cachedSandbox: CachedSandbox
    pieces: Piece[]
}

type InstallEngineParams = {
    type: SandBoxCacheType
    path: string
}
