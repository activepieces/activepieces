export * from './engine-operation'
export * from './requests'
export * from './engine-constants'
export * from './execution-errors'

export enum ExecutionMode {
    SANDBOX_PROCESS = 'SANDBOX_PROCESS',
    SANDBOX_CODE_ONLY = 'SANDBOX_CODE_ONLY',
    UNSANDBOXED = 'UNSANDBOXED',
    SANDBOX_CODE_AND_PROCESS = 'SANDBOX_CODE_AND_PROCESS',
}
