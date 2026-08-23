import {
    EngineResponse,
    EngineResponseStatus,
    ExecuteResolveConnectionIdentifierOperation,
    ExecuteResolveConnectionIdentifierResponse,
} from '@activepieces/shared'
import { pieceAuth } from '../core/piece/piece-auth'

export const resolveConnectionIdentifierOperation = {
    execute: async (operation: ExecuteResolveConnectionIdentifierOperation): Promise<EngineResponse<ExecuteResolveConnectionIdentifierResponse>> => {
        const call = await pieceAuth.callMethod({ operation, authValueType: operation.connectionType, methodPath: ['getConnectionIdentifier'] })
        const identifier = call.called ? call.result : undefined
        return {
            status: EngineResponseStatus.OK,
            response: { identifier: typeof identifier === 'string' ? identifier : undefined },
        }
    },
}
