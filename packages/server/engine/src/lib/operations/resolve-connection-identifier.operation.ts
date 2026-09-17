import {
    EngineResponse,
    EngineResponseStatus,
    ExecuteResolveConnectionIdentifierOperation,
    ExecuteResolveConnectionIdentifierResponse,
} from '@activepieces/shared'
import { EngineConstants } from '../handler/context/engine-constants'
import { pieceHelper } from '../helper/piece-helper'

export const resolveConnectionIdentifierOperation = {
    execute: async (operation: ExecuteResolveConnectionIdentifierOperation): Promise<EngineResponse<ExecuteResolveConnectionIdentifierResponse>> => {
        const output = await pieceHelper.executeResolveConnectionIdentifier({
            params: operation,
            devPieces: EngineConstants.DEV_PIECES,
        })

        return {
            status: EngineResponseStatus.OK,
            response: output,
        }
    },
}
