import { inspect } from 'util'
import {
    EngineResponse,
    EngineResponseStatus,
    ExecuteTriggerOperation,
    ExecuteTriggerResponse,
    TriggerHookType,
} from '@activepieces/shared'
import { EngineConstants } from '../handler/context/engine-constants'
import { triggerHelper } from '../helper/trigger-helper'
import { utils } from '../utils'


export const triggerHookOperation = {
    execute: async (operation: ExecuteTriggerOperation<TriggerHookType>): Promise<EngineResponse<ExecuteTriggerResponse<TriggerHookType>>> => {
        const input = operation as ExecuteTriggerOperation<TriggerHookType>
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