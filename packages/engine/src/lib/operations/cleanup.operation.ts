import { inspect } from 'util'
import {
    EngineResponse,
    EngineResponseStatus,
    ExecuteCleanupOperation,
    ExecuteCleanupResponse,
} from '@activepieces/shared'
import { EngineConstants } from '../handler/context/engine-constants'
import { executeCleanup as pieceExecutorCleanup } from '../handler/piece-executor'

export const cleanupOperation = {
    execute: async (operation: ExecuteCleanupOperation): Promise<EngineResponse<ExecuteCleanupResponse>> => {
        try {
            await pieceExecutorCleanup({
                operation,
                pieceSource: EngineConstants.PIECE_SOURCES,
                constants: EngineConstants.fromExecuteCleanupInput(operation),
            })
            return {
                status: EngineResponseStatus.OK,
                response: {
                    success: true,
                },
            }
        }
        catch (e) {
            return {
                status: EngineResponseStatus.OK,
                response: {
                    success: false,
                    message: inspect(e),
                },
            }
        }
    },
}
