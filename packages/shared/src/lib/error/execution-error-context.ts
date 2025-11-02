import { EngineOperationStepType, EngineOperationType } from '../engine/engine-operation'

export enum ExecutionErrorType {
    TIMEOUT = 'TIMEOUT',
    MEMORY = 'MEMORY',
    INTERNAL = 'INTERNAL',
    VALIDATION = 'VALIDATION',
}

export enum ExecutionErrorSource {
    ENGINE = 'ENGINE',
    USER = 'USER',
}

export const EXECUTION_ERROR_PREFIX = '[EXECUTION_ERROR]'

export interface ExecutionErrorContext {
    correlationId: string
    timestamp: string
    
    flow?: {
        flowId: string
        flowVersionId: string
    }
    
    run?: {
        runId: string
        projectId: string
    }
    
    step?: {
        name: string
        type: string
    }
    
    operation: {
        type: EngineOperationType | EngineOperationStepType
    }
    
    worker?: {
        index: number
        processId: string
    }
    
    error: {
        type: ExecutionErrorType
        source: ExecutionErrorSource
        code: string
        message: string
        stack?: string
    }
    
    input?: unknown
    executionState?: Record<string, unknown>
    
    output?: {
        stdout: string
        stderr: string
    }
    
    metadata?: Record<string, unknown>
}

export interface StructuredExecutionError extends Error {
    context: ExecutionErrorContext
    toJSON(): ExecutionErrorContext
}

export class ExecutionContextError extends Error implements StructuredExecutionError {
    constructor(
        message: string,
        public context: ExecutionErrorContext,
    ) {
        super(message)
        this.name = 'ExecutionContextError'
    }

    toJSON(): ExecutionErrorContext {
        return this.context
    }
}

