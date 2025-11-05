import { Socket } from 'socket.io-client'

export const emitWithAck = async (
    socket: Socket | undefined,
    event: string,
    data: unknown,
    options?: { timeoutMs?: number, retries?: number, retryDelayMs?: number },
): Promise<void> => {
    const timeoutMs = options?.timeoutMs ?? 4000
    const retries = options?.retries ?? 3
    const retryDelayMs = options?.retryDelayMs ?? 2000

    for (let attempt = 0; attempt <= retries; attempt++) {
        try {
            if (!socket || !socket.connected) {
                throw new Error('Socket not connected')
            }
            await socket.timeout(timeoutMs).emitWithAck(event, data)
            return
        }
        catch (error) {
            if (attempt < retries) {
                await new Promise(resolve => setTimeout(resolve, retryDelayMs))
            }
            else {
                throw error
            }
        }
    }
}
