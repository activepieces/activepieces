import { type ApLogger } from '@activepieces/server-utils'
import { FlowVersion, PiecePackage, WorkerToApiContract } from '@activepieces/shared'
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
    ready(params: { operation: ReadyOperation, log: ApLogger, apiClient: WorkerToApiContract }): Promise<Sandbox>
    invalidate(log: ApLogger): Promise<void>
    release(log: ApLogger): Promise<void>
    shutdown(log: ApLogger): Promise<void>
    getActiveSandbox(): ActiveSandboxInfo | null
}

export type ReadyOperation =
    | { kind: 'FLOW', flowVersion: FlowVersion, platformId: string, flowId: string, projectId: string }
    | { kind: 'PIECE', piece: PiecePackage, platformId: string }
