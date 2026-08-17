import { PiecePropertyMap, StaticPropsValue } from '@activepieces/pieces-framework'
import { ExecuteExtractPieceMetadata, ExecuteRefreshTokenAuthOperation, ExecuteResolveConnectionIdentifierOperation, ExecuteValidateAuthOperation, FlowTrigger, PropertySettings, TriggerHookType } from '@activepieces/shared'
import { EngineConstantsParams, ResolvedExecuteTriggerOperation } from '../handler/context/engine-constants'
import { ExecutePropsParams } from '../helper/piece-helper'
import { HookResponse } from '../utils'

export type PieceHostMethod =
    | 'getContextVersion'
    | 'runAction'
    | 'executeTrigger'
    | 'executeOnStart'
    | 'executeProps'
    | 'executeValidateAuth'
    | 'executeResolveConnectionIdentifier'
    | 'executeRefreshTokenAuth'
    | 'extractPieceMetadata'

export type PieceHostRequest = {
    id: number
    method: PieceHostMethod
    params: unknown
}

export type PieceHostResponse =
    | { id: number, ok: true, result: unknown }
    | { id: number, ok: false, error: SerializedEngineError }

export type SerializedEngineError = {
    message: string
    name?: string
    stack?: string
    isEngineError: boolean
}

export type GetContextVersionParams = {
    pieceName: string
    pieceVersion: string
    devPieces: string[]
}

export type RunActionParams = {
    pieceName: string
    pieceVersion: string
    actionName: string
    devPieces: string[]
    constantsParams: EngineConstantsParams
    resolvedInput: StaticPropsValue<PiecePropertyMap>
    propertySettings: Record<string, PropertySettings>
    isPaused: boolean
    testSingleStepMode: boolean
}

export type RunActionResult = {
    output: unknown
    hookResponse: HookResponse
}

export type ExecuteTriggerHostParams = {
    constantsParams: EngineConstantsParams
    params: ResolvedExecuteTriggerOperation<TriggerHookType>
}

export type ExecuteOnStartHostParams = {
    constantsParams: EngineConstantsParams
    trigger: FlowTrigger
    payload: unknown
}

export type ExecuteValidateAuthHostParams = {
    params: ExecuteValidateAuthOperation
    devPieces: string[]
}

export type ExecuteResolveConnectionIdentifierHostParams = {
    params: ExecuteResolveConnectionIdentifierOperation
    devPieces: string[]
}

export type ExecuteRefreshTokenAuthHostParams = {
    params: ExecuteRefreshTokenAuthOperation
    devPieces: string[]
}

export type ExtractPieceMetadataHostParams = {
    params: ExecuteExtractPieceMetadata
    devPieces: string[]
}

export type { ExecutePropsParams }

