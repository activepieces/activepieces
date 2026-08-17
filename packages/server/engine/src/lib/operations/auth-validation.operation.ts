import {
    EngineResponse,
    EngineResponseStatus,
    ExecuteValidateAuthOperation,
    ExecuteValidateAuthResponse,
} from '@activepieces/shared'
import { EngineConstants } from '../handler/context/engine-constants'
import { pieceClient } from '../piece-process/piece-client'

export const authValidationOperation = {
    execute: async (operation: ExecuteValidateAuthOperation): Promise<EngineResponse<ExecuteValidateAuthResponse>> => {
        const input = operation as ExecuteValidateAuthOperation
        const output = await pieceClient.executeValidateAuth({
            params: input,
            devPieces: EngineConstants.DEV_PIECES,
        })

        return {
            status: EngineResponseStatus.OK,
            response: output,
        }
    },
}