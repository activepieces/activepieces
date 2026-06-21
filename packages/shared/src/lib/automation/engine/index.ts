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

// Selects WHERE flow execution happens. WORKER_POOL is the original long-lived worker
// that spawns the engine as a local sandboxed process. The serverless kinds run the
// engine on a function platform; ExecutionMode (isolate vs fork) is a WORKER_POOL-internal
// sub-choice and does not apply to them.
export enum RuntimeKind {
    WORKER_POOL = 'WORKER_POOL',
    AWS_LAMBDA = 'AWS_LAMBDA',
    GCP_CLOUD_FUNCTION = 'GCP_CLOUD_FUNCTION',
}
