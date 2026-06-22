import { type ApLogger } from '@activepieces/server-utils'
import { EngineOperation, EngineOperationType, EngineResponse, FlowVersionState, PiecePackage, RuntimeKind, SourceCode, WorkerToApiContract } from '@activepieces/shared'

// A Runtime is the pluggable seam that decides WHERE each step of a job runs. The worker always
// drives the lifecycle (createExecution -> init -> run -> dispose); the runtime impl decides
// whether each step happens in the worker or in the engine/function:
//   - local-pool: init/dispose run in the worker (host-side install into a mounted cache); only
//     `run` executes the operation in the engine sandbox child process.
//   - serverless: init (bundle install) and run both execute in the function; the worker only
//     orchestrates and ships the bundle.

export type RuntimeExecution = {
    // Reserve the execution slot, capture mount/context, AND make the flow's pieces/code available
    // where `run` will read them. Atomic: must either become fully ready or clean up the slot it
    // reserved before throwing — callers only guard `run`. Must NOT spawn the engine process (so
    // the cache is populated before `run` mounts it).
    init(params: InitParams): Promise<void>
    // Execute one engine operation and return its result.
    run(params: RunParams): Promise<RuntimeExecutionResult>
    // Tear down. invalidate=true discards the executor; invalidate=false releases it for reuse.
    dispose(params: DisposeParams): Promise<void>
}

export type Runtime = {
    readonly kind: RuntimeKind
    createExecution(params: CreateExecutionParams): RuntimeExecution
    getActiveExecutors(): RuntimeExecutorInfo[]
    shutdown(log: ApLogger): Promise<void>
}

export type CreateExecutionParams = {
    workerIndex: number
    log: ApLogger
    apiClient: WorkerToApiContract
}

export type InitParams = {
    flowVersionId: string | undefined
    platformId: string
    pieces: PiecePackage[]
    codeSteps: CodeArtifact[]
}

export type RunParams = {
    operationType: EngineOperationType
    operation: EngineOperation
    timeoutInSeconds: number
}

export type DisposeParams = {
    invalidate: boolean
}

export type RuntimeExecutionResult = EngineResponse<unknown> & {
    logs: string | undefined
}

export type RuntimeExecutorInfo = {
    sandboxId: string
    boxId: number
    pid: number
    busy: boolean
}

// A code step to provision. Part of the generic init contract (InitParams.codeSteps), so it lives
// here rather than in the local-pool code-builder that consumes it.
export type CodeArtifact = {
    name: string
    sourceCode: SourceCode
    flowVersionId: string
    flowVersionState: FlowVersionState
}
