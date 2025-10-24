export * from './engine-operation'
export * from './requests'
export * from './engine-constants'

export enum ExecutionMode {
    SANDBOXED = 'SANDBOXED',
    SANDBOX_CODE_ONLY = 'SANDBOX_CODE_ONLY',
    UNSANDBOXED = 'UNSANDBOXED',
    SANDBOX_CODE_AND_PROCESS = 'SANDBOX_CODE_AND_PROCESS',
}
