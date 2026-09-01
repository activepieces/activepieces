import { ActivepiecesError, isObject, spreadIfNotUndefined, toError } from '@activepieces/core-utils'

const RPC_EVENT = 'rpc'
const NOTIFY_EVENT = 'rpc-notify'
const AP_ERROR_PROP = 'apError'
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Contract = Record<string, (input: any) => any>

type RpcSocket = {
    emit(event: string, ...args: unknown[]): unknown
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    on(event: string, listener: (...args: any[]) => void): unknown
    timeout(ms: number): { emitWithAck(event: string, ...args: unknown[]): Promise<unknown> }
}

type NotifySocket = Pick<RpcSocket, 'emit'>

export function createRpcClient<T extends Contract>(
    socket: RpcSocket,
    timeout: RpcTimeout,
): T {
    return new Proxy({} as T, {
        get(_target, method: string) {
            return async (payload: unknown) => {
                const timeoutMs = typeof timeout === 'function' ? timeout(method) : timeout
                try {
                    const result = await socket.timeout(timeoutMs).emitWithAck(RPC_EVENT, { method, payload })
                    if (isRpcErrorEnvelope(result)) {
                        throw Object.assign(
                            new Error(`RPC [${method}] handler threw: ${result.__rpcError}`),
                            spreadIfNotUndefined(AP_ERROR_PROP, result.__rpcApError),
                        )
                    }
                    return result
                }
                catch (error) {
                    if (error instanceof Error && error.message.startsWith('RPC [')) {
                        throw error
                    }
                    throw new Error(`RPC [${method}] failed (timeout: ${timeoutMs}ms): ${toError(error).message}`)
                }
            }
        },
    })
}

export function createRpcServer<T extends Contract>(
    socket: RpcSocket,
    handlers: T,
    log?: RpcLog,
): void {
    socket.on(RPC_EVENT, async (msg: { method: string, payload: unknown }, ack: (result: unknown) => void) => {
        const handler = handlers[msg.method as keyof T]
        try {
            const result = await handler(msg.payload)
            ack(result)
        }
        catch (error) {
            log?.error({ error, rpc: { method: msg.method } }, 'RPC handler threw')
            ack({
                __rpcError: toError(error).message,
                ...spreadIfNotUndefined('__rpcApError', apErrorOf(error)),
            })
        }
    })
}

export function createNotifyClient<T extends Contract>(
    socket: NotifySocket,
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
    log?: RpcLog,
): void {
    socket.on(NOTIFY_EVENT, (msg: { method: string, payload: unknown } | null | undefined) => {
        const handler = handlers[msg?.method as keyof T]
        if (typeof handler !== 'function') {
            log?.error({ rpc: { method: String(msg?.method) } }, 'Notify received for unknown method, ignoring')
            return
        }
        handler(msg?.payload)
    })
}

export function apErrorOf(error: unknown): RpcApError | undefined {
    const source = error instanceof ActivepiecesError ? error.error : isObject(error) ? error[AP_ERROR_PROP] : undefined
    if (!isObject(source) || typeof source['code'] !== 'string') {
        return undefined
    }
    const entityType = (isObject(source['params']) ? source['params'] : source)['entityType']
    return { code: source['code'], ...spreadIfNotUndefined('entityType', typeof entityType === 'string' ? entityType : undefined) }
}

function isRpcErrorEnvelope(value: unknown): value is { __rpcError: string, __rpcApError?: unknown } {
    return isObject(value) && '__rpcError' in value
}

export type RpcTimeout = number | ((method: string) => number)

export type RpcApError = {
    code: string
    entityType?: string
}

type RpcLog = {
    error(obj: unknown, msg: string): void
}
