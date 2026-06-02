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

export type Sandbox = {
    id: string
    start: (options: SandboxStartOptions) => Promise<void>
    execute: (operationType: EngineOperationType, operation: EngineOperation, options: SandboxOptions) => Promise<SandboxResult>
    shutdown: () => Promise<void>
    isReady: () => boolean
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
