

export type MachineRouting = {
    onHeartbeat: (request: OnHeartbeatParams) => Promise<void>
    acquire: () => Promise<string>
    onDisconnect: (request: OnDisconnectParams) => Promise<void>
    release: (workerId: string) => Promise<void>
}


type OnHeartbeatParams = {
    workerId: string
    totalSandboxes: number
    freeSandboxes: number
}

type OnDisconnectParams = {
    workerId: string
}

