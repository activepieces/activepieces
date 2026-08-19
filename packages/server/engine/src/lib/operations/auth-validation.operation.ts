import { isObject } from '@activepieces/core-utils'
import {
    EngineResponse,
    EngineResponseStatus,
    ExecuteValidateAuthOperation,
    ExecuteValidateAuthResponse,
} from '@activepieces/shared'
import { pieceAuth } from '../core/piece/piece-auth'

export const authValidationOperation = {
    execute: async (operation: ExecuteValidateAuthOperation): Promise<EngineResponse<ExecuteValidateAuthResponse>> => {
        const call = await pieceAuth.callMethod({ operation, authValueType: operation.auth.type, methodPath: ['validate'] })
        if (!call.called) {
            return {
                status: EngineResponseStatus.OK,
                response: call.mismatch
                    ? { valid: false, error: `Connection value type does not match piece auth type: ${call.property?.type} !== ${operation.auth.type}` }
                    : { valid: true },
            }
        }
        return {
            status: EngineResponseStatus.OK,
            response: toValidateAuthResponse(call.result),
        }
    },
}

function toValidateAuthResponse(value: unknown): ExecuteValidateAuthResponse {
    if (!isObject(value)) {
        return { valid: false, error: 'Connection validation returned an unexpected result' }
    }
    if (value.valid === true) {
        return { valid: true }
    }
    return { valid: false, error: typeof value.error === 'string' ? value.error : 'Connection validation failed' }
}
