import { WAITER_TIMEOUT_MS } from './queue-timing'

const stopping = new Set<string>()
// A poll already waiting in the dispatcher gives up after WAITER_TIMEOUT_MS. The flag has to
// still be set when that poll returns, or the job is recorded against a worker that is stopping.
const FLAG_TTL_MS = WAITER_TIMEOUT_MS + 10_000

export const stoppingConnections = {
    mark(connectionId: string): void {
        stopping.add(connectionId)
        const timer = setTimeout(() => stopping.delete(connectionId), FLAG_TTL_MS)
        timer.unref()
    },
    isStopping(connectionId: string | undefined): boolean {
        return connectionId !== undefined && stopping.has(connectionId)
    },
    reset(): void {
        stopping.clear()
    },
}

export async function holdForConnection<T>(params: {
    connectionId: string | undefined
    job: T | null
    release: (job: T) => Promise<void>
    record: (job: T) => void
}): Promise<T | null> {
    if (stoppingConnections.isStopping(params.connectionId)) {
        if (params.job) {
            await params.release(params.job)
        }
        return null
    }
    if (params.job && params.connectionId) {
        params.record(params.job)
    }
    return params.job
}
