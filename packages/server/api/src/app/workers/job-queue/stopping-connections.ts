import { WAITER_TIMEOUT_MS } from './queue-timing'

const stopping = new Set<string>()
const FLAG_TTL_MS = WAITER_TIMEOUT_MS + 10_000

function mark(connectionId: string): void {
    stopping.add(connectionId)
    const timer = setTimeout(() => stopping.delete(connectionId), FLAG_TTL_MS)
    timer.unref()
}

function isStopping(connectionId: string | undefined): boolean {
    return connectionId !== undefined && stopping.has(connectionId)
}

function reset(): void {
    stopping.clear()
}

async function holdForConnection<T>({ connectionId, job, release, record }: {
    connectionId: string | undefined
    job: T | null
    release: (job: T) => Promise<void>
    record: (params: { job: T, connectionId: string }) => void
}): Promise<T | null> {
    if (isStopping(connectionId)) {
        if (job) {
            await release(job)
        }
        return null
    }
    if (job && connectionId) {
        record({ job, connectionId })
    }
    return job
}

export const stoppingConnections = {
    mark,
    isStopping,
    reset,
    holdForConnection,
}
