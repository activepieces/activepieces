import { inspect } from 'util'
import {
    EngineResponse,
    EngineResponseStatus,
    ExecuteTriggerOperation,
    ExecuteTriggerResponse,
    TriggerHookType,
} from '@activepieces/shared'
import { EngineConstants, ResolvedExecuteTriggerOperation } from '../handler/context/engine-constants'
import { triggerHelper } from '../helper/trigger-helper'
import { utils } from '../utils'
import { resolveJobPayload } from './utils/resolve-job-payload'


export const triggerHookOperation = {
    execute: async (operation: ExecuteTriggerOperation<TriggerHookType>): Promise<EngineResponse<ExecuteTriggerResponse<TriggerHookType>>> => {
        const input: ResolvedExecuteTriggerOperation<TriggerHookType> = {
            ...operation,
            triggerPayload: await resolveJobPayload({
                payload: operation.triggerPayload,
                apiUrl: operation.internalApiUrl,
                engineToken: operation.engineToken,
            }),
        }
        const { data: output, error } = await utils.tryCatchAndThrowOnEngineError(() =>
            triggerHelper.executeTrigger({
                params: input,
                constants: EngineConstants.fromExecuteTriggerInput(input),
            }),
        )
        if (error) {
            return {
                status: EngineResponseStatus.USER_FAILURE,
                response: undefined as unknown as ExecuteTriggerResponse<TriggerHookType>,
                error: inspect(error),
            }
        }
        return {
            status: EngineResponseStatus.OK,
            response: output,
        }
    },
}