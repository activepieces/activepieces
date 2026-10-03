export const EngineExitCode = {
    UNCAUGHT_EXCEPTION: 3,
    UNHANDLED_REJECTION: 4,
    WORKER_HANDSHAKE_TIMEOUT: 5,
    WORKER_SOCKET_DISCONNECTED: 6,
} as const

export type EngineExitCode = (typeof EngineExitCode)[keyof typeof EngineExitCode]
