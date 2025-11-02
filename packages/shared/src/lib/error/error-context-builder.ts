import { EngineOperationStepType, EngineOperationType } from '../engine/engine-operation'
import { EXECUTION_ERROR_PREFIX, ExecutionErrorContext, ExecutionErrorSource, ExecutionErrorType } from './execution-error-context'

interface FlowParams {
    flowId: string
    flowVersionId: string
}

interface RunParams {
    runId: string
    projectId: string
}

interface StepParams {
    name: string
    type: string
}

interface OperationParams {
    type: EngineOperationType | EngineOperationStepType
}

interface WorkerParams {
    index: number
    processId: string
}

interface ErrorParams {
    error: unknown
    type: ExecutionErrorType
    source?: ExecutionErrorSource
}

interface OutputParams {
    stdout: string
    stderr: string
}

export class ErrorContextBuilder {
    private context: Partial<ExecutionErrorContext>

    constructor() {
        this.context = {
            timestamp: new Date().toISOString(),
            error: {
                type: ExecutionErrorType.INTERNAL,
                source: ExecutionErrorSource.ENGINE,
                code: 'UNKNOWN',
                message: 'Unknown error',
            },
        }
    }

    withFlow(params: FlowParams): this {
        this.context.flow = {
            flowId: params.flowId,
            flowVersionId: params.flowVersionId,
        }
        return this
    }

    withRun(params: RunParams): this {
        this.context.run = {
            runId: params.runId,
            projectId: params.projectId,
        }
        return this
    }

    withStep(params: StepParams): this {
        this.context.step = {
            name: params.name,
            type: params.type,
        }
        return this
    }

    withOperation(params: OperationParams): this {
        this.context.operation = {
            type: params.type,
        }
        return this
    }

    withWorker(params: WorkerParams): this {
        this.context.worker = {
            index: params.index,
            processId: params.processId,
        }
        return this
    }

    withError(params: ErrorParams): this {
        if (params.error instanceof Error) {
            this.context.error = {
                type: params.type,
                source: params.source ?? ExecutionErrorSource.ENGINE,
                code: params.error.name,
                message: params.error.message,
                stack: params.error.stack,
            }
        } else {
            this.context.error = {
                type: params.type,
                source: params.source ?? ExecutionErrorSource.ENGINE,
                code: 'UNKNOWN',
                message: String(params.error),
            }
        }
        return this
    }

    withInput(input: unknown): this {
        this.context.input = input
        return this
    }

    withExecutionState(executionState: Record<string, unknown>): this {
        this.context.executionState = executionState
        return this
    }

    withOutput(params: OutputParams): this {
        this.context.output = {
            stdout: params.stdout,
            stderr: params.stderr,
        }
        return this
    }

    withMetadata(metadata: Record<string, unknown>): this {
        this.context.metadata = { ...this.context.metadata, ...metadata }
        return this
    }

    build(): ExecutionErrorContext {
        return this.context as ExecutionErrorContext
    }

    buildAndLog(): ExecutionErrorContext {
        const context = this.build()
        console.error(EXECUTION_ERROR_PREFIX, JSON.stringify(context, null, 2))
        return context
    }
}

export const createErrorContext = (): ErrorContextBuilder => {
    return new ErrorContextBuilder()
}

