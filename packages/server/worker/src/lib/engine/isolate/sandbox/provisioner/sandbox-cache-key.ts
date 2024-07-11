import { logger } from '@activepieces/server-shared'
import { apId, FlowVersionId } from '@activepieces/shared'

export enum SandBoxCacheType {
    CODE = 'CODE',
    FLOW = 'FLOW',
    NONE = 'NONE',
    PIECE = 'PIECE',
}
export const extractProvisionCacheKey = (
    params: TypedProvisionCacheInfo,
): string => {
    logger.debug({ type: params.type }, '[SandboxProvisioner#extractCacheKey]')
    switch (params.type) {
        case SandBoxCacheType.CODE:
            return `CODE-sourceCodeHash-${params.sourceCodeHash}-name-${params.name}-flowId-${params.flowId}`
        case SandBoxCacheType.FLOW:
            return `FLOW-flowVersionId-${params.flowVersionId}`
        case SandBoxCacheType.NONE:
            return `NONE-apId-${apId()}`
        case SandBoxCacheType.PIECE:
            return `PIECE-pieceName-${params.pieceName}-pieceVersion-${params.pieceVersion}`
    }
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

type PieceProvisionCacheInfo = BaseProvisionCacheInfo<SandBoxCacheType.PIECE> & {
    pieceName: string
    pieceVersion: string
}

export type TypedProvisionCacheInfo = CodeProvisionCacheInfo | FlowProvisionCacheInfo | NoneProvisionCacheInfo | PieceProvisionCacheInfo

