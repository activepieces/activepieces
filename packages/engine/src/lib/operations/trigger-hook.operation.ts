import {
    EngineResponse,
    EngineResponseStatus,
    ExecuteTriggerOperation,
    ExecuteTriggerResponse,
    TriggerHookType,
} from '@activepieces/shared'
import { EngineConstants } from '../handler/context/engine-constants'
import { triggerHelper } from '../helper/trigger-helper'


export const triggerHookOperation = {
    execute: async (operation: ExecuteTriggerOperation<TriggerHookType>): Promise<EngineResponse<ExecuteTriggerResponse<TriggerHookType>>> => {
        const input = operation as ExecuteTriggerOperation<TriggerHookType>
        const output = await triggerHelper.executeTrigger({
            params: input,
            constants: EngineConstants.fromExecuteTriggerInput(input),
        })
        return {
            status: EngineResponseStatus.OK,
            response: output,
        }
    },
}