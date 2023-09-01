import { Sandbox } from '..'
import { sandboxCachePool } from '../cache/sandbox-cache-pool'
import { sandboxManager } from '../sandbox-manager'
import { FileId, FlowVersionId, apId } from '@activepieces/shared'
import { SandBoxCacheType } from './sandbox-cache-type'
import { logger } from '../../../helper/logger'

export const sandboxProvisioner = {
    async provision({ pieces = [], ...cacheInfo }: ProvisionParams): Promise<Sandbox> {
        const cacheKey = extractCacheKey(cacheInfo)

        const cachedSandbox = await sandboxCachePool.findOrCreate({
            key: cacheKey,
            type: cacheInfo.type,
        })

        await cachedSandbox.prepare({ pieces })
        const sandbox = await sandboxManager.allocate()

        await sandbox.assignCache({
            cacheKey,
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

const extractCacheKey = (params: ProvisionCacheInfo): string => {
    logger.debug({ type: params.type }, '[SandboxProvisioner#extractCacheKey]')

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
    return `CODE-artifactSourceId-${artifactSourceId}`
}

const extractFlowCacheKey = ({ flowVersionId }: FlowProvisionCacheInfo): string => {
    return `FLOW-flowVersionId-${flowVersionId}`
}

const extractNoneCacheKey = (_params: NoneProvisionCacheInfo): string => {
    return `NONE-apId-${apId()}`
}

const extractPieceCacheKey = ({ pieceName, pieceVersion }: PieceProvisionCacheInfo): string => {
    return `PIECE-pieceName-${pieceName}-pieceVersion-${pieceVersion}`
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
