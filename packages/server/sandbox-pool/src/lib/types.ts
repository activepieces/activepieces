import { type ApLogger } from '@activepieces/server-utils'
import { EngineOperation, EngineOperationType, EngineResponse, FlowVersion, FlowVersionState, NetworkMode, PiecePackage, RuntimeKind, SourceCode, WorkerToApiContract } from '@activepieces/shared'

// A Runtime is the pluggable seam that decides WHERE each step of a job runs. The worker always
// drives the lifecycle (createExecution -> provision -> run -> dispose); the runtime impl decides
// whether each step happens in the worker or in the engine/function:
//   - local-pool: provision/dispose run in the worker (host-side install into a mounted cache); only
//     `run` executes the operation in the engine sandbox child process.
//   - serverless: provision (bundle install) and run both execute in the function; the worker only
//     orchestrates and ships the bundle.

export type RuntimeExecution = {
    // Resolve flow/piece dependencies, reserve the execution slot, materialize pieces/code into the
    // cache, and capture mount context. Returns a discriminated result rather than throwing for
    // expected missing-flow / disabled-flow cases. Atomic: on unexpected error the slot is released
    // before the promise rejects — callers only guard `run`. Must NOT spawn the engine process.
    provision(input: ProvisionInput): Promise<ProvisionResult>
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

export type ProvisionInput = {
    platformId: string
    flow?: { id: string, versionId: string, projectId: string }
    pieces?: PiecePackage[]
    codes?: CodeArtifact[]
}

export type ProvisionResult =
    | { kind: 'ready', flowVersion?: FlowVersion }
    | { kind: 'flow-not-found' }
    | { kind: 'disabled' }

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

// A code step to provision. Part of the generic provision contract (ProvisionInput.codeSteps), so
// it lives here rather than in the local-pool code-builder that consumes it.
export type CodeArtifact = {
    name: string
    sourceCode: SourceCode
    flowVersionId: string
    flowVersionState: FlowVersionState
}

// Structural subset of WorkerSettingsResponse used by the local-pool runtime tree.
// Field names intentionally match WorkerSettingsResponse so workerSettings.getSettings is
// directly assignable to () => SandboxPoolSettings without wrapping.
// ENVIRONMENT and EXECUTION_MODE are strings (matching the Zod schema) — comparisons
// against ApEnvironment / ExecutionMode enum values still work because enum values are strings.
export type SandboxPoolSettings = {
    EXECUTION_MODE: string
    DEV_PIECES: string[]
    ENVIRONMENT: string
    REUSE_SANDBOX: string | undefined
    FLOW_TIMEOUT_SECONDS: number
    MAX_FILE_SIZE_MB: number
    MAX_FLOW_RUN_LOG_SIZE_MB: number
    NETWORK_MODE: NetworkMode
    SANDBOX_MEMORY_LIMIT: string
    SANDBOX_PROPAGATED_ENV_VARS: string[]
    SSRF_ALLOW_LIST: string[]
    PIECES_BUNDLE_BASE_URL: string | undefined
}

export type SandboxPoolDeps = {
    basePath: string
    getSettings: () => SandboxPoolSettings
    log: ApLogger
}
