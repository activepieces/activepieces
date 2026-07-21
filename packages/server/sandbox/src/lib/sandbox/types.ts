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
    // When set, the box launches inside this pre-provisioned namespace instead of the host netns.
    netnsName?: string
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
    basePath: string
    command?: string[]
    baseMounts?: SandboxMount[]
    wsRpcPort?: number
    // Resolves the per-box egress namespace under isolate + STRICT; the WS-RPC server binds gatewayHost.
    getEgress?: (log: SandboxLogger) => Promise<EgressInfo | null>
    egressNeedsRotation?: (log: SandboxLogger) => Promise<boolean>
}

export type EgressInfo = {
    netnsName: string
    gatewayHost: string
    callbackApiUrl: string | null
    callbackPort: number | null
    apiAllow: string | null
    apiHostPin: string | null
    fingerprint: string
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
