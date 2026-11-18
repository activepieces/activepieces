const BEGIN_SHUTDOWN_TIMEOUT_MS = 5_000
const JOB_MARGIN_MS = 90_000
const TEARDOWN_MS = 10_000

function drainMs({ flowTimeoutMs }: { flowTimeoutMs: number }): number {
    return flowTimeoutMs + JOB_MARGIN_MS
}

function forceExitMs({ flowTimeoutMs }: { flowTimeoutMs: number }): number {
    return BEGIN_SHUTDOWN_TIMEOUT_MS + drainMs({ flowTimeoutMs }) + TEARDOWN_MS
}

export const shutdownBudget = {
    BEGIN_SHUTDOWN_TIMEOUT_MS,
    drainMs,
    forceExitMs,
}
