import { ContextVersion, ExecutePropsResult, PieceMetadata, PropertyType } from '@activepieces/pieces-framework'
import { ExecuteRefreshTokenAuthResponse, ExecuteResolveConnectionIdentifierResponse, ExecuteTriggerResponse, ExecuteValidateAuthResponse, FlowTrigger, TriggerHookType } from '@activepieces/shared'
import { EngineConstants, engineConstantsToParams, ResolvedExecuteTriggerOperation } from '../handler/context/engine-constants'
import { ExecutePropsParams, pieceHelper } from '../helper/piece-helper'
import { pieceLoader } from '../helper/piece-loader'
import { triggerHelper } from '../helper/trigger-helper'
import { pieceProcessConfig } from './config'
import { pieceHost } from './piece-host'
import {
    ExecuteRefreshTokenAuthHostParams,
    ExecuteResolveConnectionIdentifierHostParams,
    ExecuteValidateAuthHostParams,
    ExtractPieceMetadataHostParams,
    GetContextVersionParams,
    RunActionParams,
    RunActionResult,
} from './piece-process-types'
import { runActionCore } from './run-action-core'

type ExecuteTriggerArgs = {
    params: ResolvedExecuteTriggerOperation<TriggerHookType>
    constants: EngineConstants
}

export const pieceClient = {
    getContextVersion: async (params: GetContextVersionParams): Promise<ContextVersion | undefined> => {
        if (!pieceProcessConfig.shouldOffload) {
            const piece = await pieceLoader.loadPieceOrThrow(params)
            return piece.getContextInfo?.().version
        }
        const version = await pieceHost.call<ContextVersion | null>('getContextVersion', params)
        return version ?? undefined
    },
    runAction: async (params: RunActionParams): Promise<RunActionResult> => {
        if (!pieceProcessConfig.shouldOffload) {
            return runActionCore(params)
        }
        return pieceHost.call<RunActionResult>('runAction', params)
    },
    executeTrigger: async ({ params, constants }: ExecuteTriggerArgs): Promise<ExecuteTriggerResponse<TriggerHookType>> => {
        if (!pieceProcessConfig.shouldOffload) {
            return triggerHelper.executeTrigger({ params, constants })
        }
        return pieceHost.call<ExecuteTriggerResponse<TriggerHookType>>('executeTrigger', {
            constantsParams: engineConstantsToParams(constants),
            params,
        })
    },
    executeOnStart: async (trigger: FlowTrigger, constants: EngineConstants, payload: unknown): Promise<void> => {
        if (!pieceProcessConfig.shouldOffload) {
            await triggerHelper.executeOnStart(trigger, constants, payload)
            return
        }
        await pieceHost.call('executeOnStart', {
            constantsParams: engineConstantsToParams(constants),
            trigger,
            payload,
        })
    },
    executeProps: async (params: ExecutePropsParams): Promise<ExecutePropsResult<PropertyType.DROPDOWN | PropertyType.MULTI_SELECT_DROPDOWN | PropertyType.DYNAMIC>> => {
        if (!pieceProcessConfig.shouldOffload) {
            return pieceHelper.executeProps(params)
        }
        return pieceHost.call('executeProps', params)
    },
    executeValidateAuth: async (params: ExecuteValidateAuthHostParams): Promise<ExecuteValidateAuthResponse> => {
        if (!pieceProcessConfig.shouldOffload) {
            return pieceHelper.executeValidateAuth(params)
        }
        return pieceHost.call('executeValidateAuth', params)
    },
    executeResolveConnectionIdentifier: async (params: ExecuteResolveConnectionIdentifierHostParams): Promise<ExecuteResolveConnectionIdentifierResponse> => {
        if (!pieceProcessConfig.shouldOffload) {
            return pieceHelper.executeResolveConnectionIdentifier(params)
        }
        return pieceHost.call('executeResolveConnectionIdentifier', params)
    },
    executeRefreshTokenAuth: async (params: ExecuteRefreshTokenAuthHostParams): Promise<ExecuteRefreshTokenAuthResponse> => {
        if (!pieceProcessConfig.shouldOffload) {
            return pieceHelper.executeRefreshTokenAuth(params)
        }
        return pieceHost.call('executeRefreshTokenAuth', params)
    },
    extractPieceMetadata: async (params: ExtractPieceMetadataHostParams): Promise<PieceMetadata> => {
        if (!pieceProcessConfig.shouldOffload) {
            return pieceHelper.extractPieceMetadata(params)
        }
        return pieceHost.call('extractPieceMetadata', params)
    },
}
