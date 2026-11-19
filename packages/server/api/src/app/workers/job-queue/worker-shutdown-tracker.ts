import { WAITER_TIMEOUT_MS } from './queue-dispatcher'

const MARK_TTL_MS = WAITER_TIMEOUT_MS + 10_000

const shuttingDownConnectionIds = new Set<string>()

export const workerShutdownTracker = {
    markShuttingDown(connectionId: string): void {
        shuttingDownConnectionIds.add(connectionId)
        setTimeout(() => shuttingDownConnectionIds.delete(connectionId), MARK_TTL_MS).unref()
    },
    isShuttingDown(connectionId: string | undefined): boolean {
        return connectionId !== undefined && shuttingDownConnectionIds.has(connectionId)
    },
    reset(): void {
        shuttingDownConnectionIds.clear()
    },
}
