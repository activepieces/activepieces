const RPC_EVENT = 'rpc'
const NOTIFY_EVENT = 'rpc-notify'
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Contract = Record<string, (input: any) => any>

type RpcSocket = {
    emit(event: string, ...args: unknown[]): unknown
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    on(event: string, listener: (...args: any[]) => void): unknown
    timeout(ms: number): { emitWithAck(event: string, ...args: unknown[]): Promise<unknown> }
}

export function createRpcClient<T extends Contract>(
    socket: RpcSocket,
    timeoutMs: number,
): T {
    return new Proxy({} as T, {
        get(_target, method: string) {
            return async (payload: unknown) => {
                try {
                    const result = await socket.timeout(timeoutMs).emitWithAck(RPC_EVENT, { method, payload })
                    if (isRpcErrorEnvelope(result)) {
                        throw new Error(`RPC [${method}] handler threw: ${result.__rpcError}`)
                    }
                    return result
                }
                catch (error) {
                    if (error instanceof Error && error.message.startsWith('RPC [')) {
                        throw error
                    }
                    const message = error instanceof Error ? error.message : String(error)
                    throw new Error(`RPC [${method}] failed (timeout: ${timeoutMs}ms): ${message}`)
                }
            }
        },
    })
}

export function createRpcServer<T extends Contract>(
    socket: RpcSocket,
    handlers: T,
): void {
    socket.on(RPC_EVENT, async (msg: { method: string, payload: unknown }, ack: (result: unknown) => void) => {
        const handler = handlers[msg.method as keyof T]
        try {
            const result = await handler(msg.payload)
            ack(result)
        }
        catch (error) {
            ack({ __rpcError: error instanceof Error ? error.message : String(error) })
        }
    })
}

export function createNotifyClient<T extends Contract>(
    socket: RpcSocket,
): T {
    return new Proxy({} as T, {
        get(_target, method: string) {
            return (payload: unknown) => {
                socket.emit(NOTIFY_EVENT, { method, payload })
            }
        },
    })
}

export function createNotifyServer<T extends Contract>(
    socket: RpcSocket,
    handlers: T,
): void {
    socket.on(NOTIFY_EVENT, (msg: { method: string, payload: unknown }) => {
        const handler = handlers[msg.method as keyof T]
        handler(msg.payload)
    })
}

function isRpcErrorEnvelope(value: unknown): value is { __rpcError: string } {
    return typeof value === 'object' && value !== null && '__rpcError' in value
}
