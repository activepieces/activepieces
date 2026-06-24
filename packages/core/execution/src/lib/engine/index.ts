export * from './engine-operation'
export * from './engine-contract'
export * from './requests'
export * from './engine-constants'
export * from './execution-errors'

export enum ExecutionMode {
    SANDBOX_PROCESS = 'SANDBOX_PROCESS',
    SANDBOX_CODE_ONLY = 'SANDBOX_CODE_ONLY',
    UNSANDBOXED = 'UNSANDBOXED',
    SANDBOX_CODE_AND_PROCESS = 'SANDBOX_CODE_AND_PROCESS',
}

// Names the two deployment modes of the SAME execution path (the sandbox pool). LOCAL embeds the
// pool in the long-lived worker at concurrency N. GCP_CLOUD_RUN embeds the same pool at concurrency 1
// in a Docker image behind an HTTP server. The execution logic does not diverge between them — only
// the injected base cache path and the concurrency differ. ExecutionMode (isolate vs fork) is an
// internal sub-choice of the pool and is unaffected.
export enum RuntimeKind {
    LOCAL = 'LOCAL',
    GCP_CLOUD_RUN = 'GCP_CLOUD_RUN',
}
