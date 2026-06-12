import {
    EngineResponse,
    EngineResponseStatus,
    ExecuteRefreshAuthOperation,
    ExecuteRefreshAuthResponse,
} from '@activepieces/shared'
import { EngineConstants } from '../handler/context/engine-constants'
import { pieceHelper } from '../helper/piece-helper'

export const authRefreshOperation = {
    execute: async (operation: ExecuteRefreshAuthOperation): Promise<EngineResponse<ExecuteRefreshAuthResponse>> => {
        const output = await pieceHelper.executeRefreshAuth({
            params: operation,
            devPieces: EngineConstants.DEV_PIECES,
        })

        return {
            status: EngineResponseStatus.OK,
            response: output,
        }
    },
}
