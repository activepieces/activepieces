import { ExecutionError, ExecutionErrorType } from '@activepieces/shared'
import { SerializedEngineError } from './piece-process-types'

export function serializeEngineError(error: unknown): SerializedEngineError {
    const isEngineError = error instanceof ExecutionError && error.type === ExecutionErrorType.ENGINE
    if (error instanceof Error) {
        return {
            message: error.message,
            name: error.name,
            stack: error.stack,
            isEngineError,
        }
    }
    return {
        message: String(error),
        isEngineError: false,
    }
}

export function reconstructEngineError(serialized: SerializedEngineError): ExecutionError {
    const type = serialized.isEngineError ? ExecutionErrorType.ENGINE : ExecutionErrorType.USER
    const error = new ExecutionError(serialized.name ?? 'PieceHostError', serialized.message, type)
    if (serialized.stack) {
        error.stack = serialized.stack
    }
    return error
}
