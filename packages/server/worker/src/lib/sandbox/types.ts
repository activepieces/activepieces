import { ChildProcess } from 'child_process'
import { EngineOperation, EngineOperationType, EngineResponse } from '@activepieces/shared'

export type SandboxMount = {
    hostPath: string
    sandboxPath: string
    optional?: boolean
}

export type SandboxResourceLimits = {
    memoryLimitMb: number
    cpuMsPerSec: number
    timeLimitSeconds: number
}

export type CreateSandboxProcessParams = {
    sandboxId: string
    command: string[]
    mounts: SandboxMount[]
    env: Record<string, string>
    resourceLimits: SandboxResourceLimits
}

export type SandboxProcessMaker = {
    create: (params: CreateSandboxProcessParams) => Promise<ChildProcess>
}

export type SandboxResult = EngineResponse<unknown> & {
    logs: string | undefined
}

/**
 * The absolute deadline (`flowStart + FLOW_TIMEOUT`, epoch ms) of the in-flight operation, owned by
 * the worker — it armed the sandbox-kill timer. Shared with the worker AI service so the agent loop
 * can derive its remaining budget and arm an AbortController that fires cleanly just before the
 * sandbox-kill backstop. `null` between operations. The engine cannot see elapsed flow time, which
 * is why this lives on the worker, not "at the step".
 */
export type ExecutionDeadlineRef = {
    epochMs: number | null
}

export type Sandbox = {
    id: string
    start: (options: SandboxStartOptions) => Promise<void>
    execute: (operationType: EngineOperationType, operation: EngineOperation, options: SandboxOptions) => Promise<SandboxResult>
    shutdown: () => Promise<void>
    isReady: () => boolean
    getPid: () => number | null
    isBusy: () => boolean
}

export type SandboxStartOptions = {
    flowVersionId: string | undefined
    platformId: string
    mounts: SandboxMount[]
}

export type SandboxInitOptions = {
    env: Record<string, string>
    memoryLimitMb: number
    cpuMsPerSec: number
    timeLimitSeconds: number
    reusable: boolean
    maxHttpBufferSizeBytes: number
    command?: string[]
    baseMounts?: SandboxMount[]
    wsRpcPort?: number
}

export type SandboxOptions = {
    timeoutInSeconds: number
}

export type SandboxLogger = {
    info: (obj: unknown, msg?: string) => void
    debug: (obj: unknown, msg?: string) => void
    error: (obj: unknown, msg?: string) => void
    warn: (obj: unknown, msg?: string) => void
}
