import { ExecutePropsResult, PropertyType } from '@activepieces/pieces-framework'
import {
    EngineResponse,
    EngineResponseStatus,
    ExecutePropsOptions,
} from '@activepieces/shared'
import { pieceHelper } from '../helper/piece-helper'


export const propertyOperation = {
    execute: async (operation: ExecutePropsOptions): Promise<EngineResponse<ExecutePropsResult<PropertyType.DROPDOWN | PropertyType.MULTI_SELECT_DROPDOWN | PropertyType.DYNAMIC>>> => {
        const output = await pieceHelper.executeProps({
            ...operation,
            pieceName: operation.piece.pieceName,
            pieceVersion: operation.piece.pieceVersion,
        })
        return {
            status: EngineResponseStatus.OK,
            response: output,
        }
    },
}