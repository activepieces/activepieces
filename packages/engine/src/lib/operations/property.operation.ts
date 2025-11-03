import { ExecutePropsResult, PropertyType } from '@activepieces/pieces-framework'
import {
    EngineResponse,
    EngineResponseStatus,
    ExecutePropsOptions,
} from '@activepieces/shared'
import { EngineConstants } from '../handler/context/engine-constants'
import { testExecutionContext } from '../handler/context/test-execution-context'
import { pieceHelper } from '../helper/piece-helper'


export const propertyOperation = {
    execute: async (operation: ExecutePropsOptions): Promise<EngineResponse<ExecutePropsResult<PropertyType.DROPDOWN | PropertyType.MULTI_SELECT_DROPDOWN | PropertyType.DYNAMIC>>> => {
        const input = operation as ExecutePropsOptions
        const output = await pieceHelper.executeProps({
            params: input,
            pieceSource: EngineConstants.PIECE_SOURCES,
            executionState: await testExecutionContext.stateFromFlowVersion({
                apiUrl: input.internalApiUrl,
                flowVersion: input.flowVersion,
                projectId: input.projectId,
                engineToken: input.engineToken,
                sampleData: input.sampleData,
            }),
            searchValue: input.searchValue,
            constants: EngineConstants.fromExecutePropertyInput(input),
        })
        return {
            status: EngineResponseStatus.OK,
            response: output,
        }
    },
}