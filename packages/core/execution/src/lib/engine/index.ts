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

// Selects WHERE flow execution happens. LOCAL_POOL is the original long-lived worker
// that spawns the engine as a local sandboxed process. GCP_CLOUD_FUNCTION runs the engine
// on a serverless function platform; ExecutionMode (isolate vs fork) is a LOCAL_POOL-internal
// sub-choice and does not apply to it.
export enum RuntimeKind {
    LOCAL_POOL = 'LOCAL_POOL',
    GCP_CLOUD_FUNCTION = 'GCP_CLOUD_FUNCTION',
}
