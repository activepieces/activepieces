import { type ApLogger } from '@activepieces/server-utils'
import { EngineOperation, EngineOperationType, EngineResponse, FlowVersion, FlowVersionState, NetworkMode, PiecePackage, RuntimeKind, SourceCode } from '@activepieces/shared'

// The seam has two halves, split along the line "what varies by Runtime Kind":
//   - Resolver (kind-INDEPENDENT, worker-side, owns the only apiClient): turns a job into a
//     fully-materialized `ProvisionInput` — resolve the flowVersion, piece metadata, and a ready
//     (compiled) flow bundle, disabling the flow on a missing piece. Always runs before `execute`.
//   - Runtime (kind-DEPENDENT): a single `execute` whose transport varies — in-process for LOCAL,
//     POST /execute for GCP_CLOUD_RUN. It never reaches the app; it materializes the passed
//     ProvisionInput, acquires a slot, runs one operation, and releases (or invalidates on throw).

export type Resolver = {
    resolve(input: ResolveInput): Promise<ResolveResult>
}

export type ResolveInput = {
    platformId: string
    publicApiUrl: string
    engineToken: string
    flow?: { id: string, versionId: string, projectId: string }
    pieces?: PiecePackage[]
}

export type ResolveResult =
    | { kind: 'ready', provision: ProvisionInput, flowVersion?: FlowVersion }
    | { kind: 'flow-not-found' }
    | { kind: 'disabled' }

export type Runtime = {
    readonly kind: RuntimeKind
    // Materialize provision, run one engine operation, return its result. Owns the slot lifecycle
    // internally: acquire -> run -> release on success / invalidate on throw. Re-raises the sandbox
    // ActivepiecesError codes (timeout / memory / log-size) that handlers already catch.
    execute(params: ExecuteParams): Promise<RuntimeExecutionResult>
    getActiveExecutors(): RuntimeExecutorInfo[]
    shutdown(log: ApLogger): Promise<void>
}

export type ExecuteParams = {
    workerIndex: number
    log: ApLogger
    operationType: EngineOperationType
    operation: EngineOperation
    timeoutInSeconds: number
    provision: ProvisionInput
}

// The Resolver's output and the pool's input. The pool installs each piece straight from a link: it
// builds `${publicApiUrl}v1/engine/pieces/bundle?name=&version=&token=` per piece and hands that URL
// to `bun install`, which follows the endpoint's redirect to npm / signed-S3 (or streams the custom
// archive). No bytes cross the worker socket and the pool never imports WorkerToApiContract; the link
// is publicApiUrl-based so it is reachable from a remote pool (Cloud Run). See ADR 0002.
export type ProvisionInput = {
    platformId: string
    flowVersionId?: string
    pieces: PiecePackage[]
    codes: CodeArtifact[]
    publicApiUrl: string
    engineToken: string
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

// A code step to provision. Part of the generic provision contract (ProvisionInput.codes), so it
// lives here rather than in the local-pool code-builder that consumes it.
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
}

export type SandboxPoolDeps = {
    basePath: string
    getSettings: () => SandboxPoolSettings
    log: ApLogger
}
