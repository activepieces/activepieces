import {
    EngineResponse,
    EngineResponseStatus,
    ExecuteRefreshTokenAuthOperation,
    ExecuteRefreshTokenAuthResponse,
} from '@activepieces/shared'
import { EngineConstants } from '../handler/context/engine-constants'
import { pieceClient } from '../piece-process/piece-client'

export const authRefreshOperation = {
    execute: async (operation: ExecuteRefreshTokenAuthOperation): Promise<EngineResponse<ExecuteRefreshTokenAuthResponse>> => {
        const output = await pieceClient.executeRefreshTokenAuth({
            params: operation,
            devPieces: EngineConstants.DEV_PIECES,
        })
        return {
            status: EngineResponseStatus.OK,
            response: output,
        }
    },
}
