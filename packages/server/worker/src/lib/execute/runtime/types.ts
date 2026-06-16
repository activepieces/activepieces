import { type ApLogger } from '@activepieces/server-utils'
import { FlowVersion, WorkerToApiContract } from '@activepieces/shared'
import { Sandbox } from './sandbox-contract'

export enum ExecutionRuntime {
    WORKER_POOL = 'WORKER_POOL',
}

export type ActiveSandboxInfo = {
    sandboxId: string
    boxId: number
    pid: number
    busy: boolean
}

export type FlowExecutionRuntime = {
    acquire(params: { log: ApLogger, apiClient: WorkerToApiContract }): Sandbox
    invalidate(log: ApLogger): Promise<void>
    release(log: ApLogger): Promise<void>
    shutdown(log: ApLogger): Promise<void>
    getActiveSandbox(): ActiveSandboxInfo | null
}

export type RuntimeProvisioner = {
    provision(params: {
        flowVersion: FlowVersion
        platformId: string
        flowId: string
        projectId: string
        log: ApLogger
        apiClient: WorkerToApiContract
    }): Promise<boolean>
}
