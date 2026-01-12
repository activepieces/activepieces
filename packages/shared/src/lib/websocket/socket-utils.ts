import { Socket } from 'socket.io-client'
import { tryCatch } from '../common'

export const emitWithAck = async <T = unknown>(
    socket: Socket | undefined,
    event: string,
    data: unknown,
    options?: { timeoutMs?: number, retries?: number, retryDelayMs?: number },
): Promise<T> => {
    const timeoutMs = options?.timeoutMs ?? 4000
    const retries = options?.retries ?? 3
    const retryDelayMs = options?.retryDelayMs ?? 2000

    for (let attempt = 0; attempt <= retries; attempt++) {
        const result = await tryCatch(async () => {
            if (!socket || !socket.connected) {
                throw new Error('Socket not connected')
            }
            return await socket.timeout(timeoutMs).emitWithAck(event, data) as T
        })

        if (result.error) {
            if (attempt < retries) {
                await new Promise(resolve => setTimeout(resolve, retryDelayMs))
            }
            else {
                throw result.error
            }
        }
        else {
            return result.data
        }
    }
    throw new Error(`Failed to emit event after ${retries} retries`)
}
