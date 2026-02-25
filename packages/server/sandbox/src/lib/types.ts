import { ChildProcess } from 'child_process'
import { EngineOperation, EngineOperationType, EngineResponse, EngineSocketEvent } from '@activepieces/shared'

export type SandboxMount = {
    hostPath: string
    sandboxPath: string
    optional?: boolean
}

export type SandboxResourceLimits = {
    memoryBytes: number
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

export type Sandbox = {
    id: string
    start: (options: SandboxStartOptions) => Promise<void>
    execute: (operationType: EngineOperationType, operation: EngineOperation, options: SandboxOptions) => Promise<SandboxResult>
    shutdown: () => Promise<void>
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
}

export type SandboxResult = {
    engine: EngineResponse<unknown>
    stdOut: string
    stdError: string
}

export type SandboxOptions = {
    timeoutInSeconds: number
}

export type SandboxEventListener = (event: EngineSocketEvent, payload: unknown) => Promise<void>

export type SandboxSocketEventHandler = {
    handle: (log: SandboxLogger, event: EngineSocketEvent, payload: unknown) => Promise<void>
}

export type SandboxWebsocketServer = {
    init: (log: SandboxLogger, port?: number) => void
    attachListener: (sandboxId: string, listener: SandboxEventListener) => void
    removeListener: (sandboxId: string) => void
    isConnected: (sandboxId: string) => boolean
    send: (sandboxId: string, operation: EngineOperation, operationType: EngineOperationType) => void
    waitForConnection: (sandboxId: string) => Promise<void>
    shutdown: () => Promise<void>
}

export type SandboxFactory = (log: SandboxLogger, sandboxId: string) => Sandbox

export type SandboxPool = {
    init: (log: SandboxLogger, options: SandboxPoolInitOptions) => void
    allocate: (log: SandboxLogger) => Promise<Sandbox>
    release: (sandbox: Sandbox | undefined, log?: SandboxLogger) => Promise<void>
    drain: () => Promise<void>
    getTotalSandboxes: () => number
    getFreeSandboxes: () => number
}

export type SandboxPoolInitOptions = {
    concurrency: number
    reusable: boolean
    getGeneration: () => number
}

export type SandboxLogger = {
    info: (obj: unknown, msg?: string) => void
    debug: (obj: unknown, msg?: string) => void
    error: (obj: unknown, msg?: string) => void
    warn: (obj: unknown, msg?: string) => void
}
