import { logger } from '@activepieces/server-shared'
import { apId, FlowVersionId } from '@activepieces/shared'

export enum SandBoxCacheType {
    CODE = 'CODE',
    FLOW = 'FLOW',
    NONE = 'NONE',
    PIECE = 'PIECE',
}

export type TypedProvisionCacheInfo<
    T extends SandBoxCacheType = SandBoxCacheType,
> = T extends SandBoxCacheType.CODE
    ? CodeProvisionCacheInfo
    : T extends SandBoxCacheType.FLOW
        ? FlowProvisionCacheInfo
        : T extends SandBoxCacheType.NONE
            ? NoneProvisionCacheInfo
            : T extends SandBoxCacheType.PIECE
                ? PieceProvisionCacheInfo
                : never

export type ProvisionCacheInfo = TypedProvisionCacheInfo

export const extractProvisionCacheKey = (
    params: ProvisionCacheInfo,
): string => {
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

const extractCodeCacheKey = ({
    sourceCodeHash,
    name,
    flowId,
}: CodeProvisionCacheInfo): string => {
    return `CODE-sourceCodeHash-${sourceCodeHash}-name-${name}-flowId-${flowId}`
}

const extractFlowCacheKey = ({
    flowVersionId,
}: FlowProvisionCacheInfo): string => {
    return `FLOW-flowVersionId-${flowVersionId}`
}

const extractNoneCacheKey = (_params: NoneProvisionCacheInfo): string => {
    return `NONE-apId-${apId()}`
}

const extractPieceCacheKey = ({
    pieceName,
    pieceVersion,
}: PieceProvisionCacheInfo): string => {
    return `PIECE-pieceName-${pieceName}-pieceVersion-${pieceVersion}`
}

type BaseProvisionCacheInfo<T extends SandBoxCacheType> = {
    type: T
}

type CodeProvisionCacheInfo = BaseProvisionCacheInfo<SandBoxCacheType.CODE> & {
    sourceCodeHash: string
    name: string
    flowId: string
}

type FlowProvisionCacheInfo = BaseProvisionCacheInfo<SandBoxCacheType.FLOW> & {
    flowVersionId: FlowVersionId
}

type NoneProvisionCacheInfo = BaseProvisionCacheInfo<SandBoxCacheType.NONE>

type PieceProvisionCacheInfo =
  BaseProvisionCacheInfo<SandBoxCacheType.PIECE> & {
      pieceName: string
      pieceVersion: string
  }
