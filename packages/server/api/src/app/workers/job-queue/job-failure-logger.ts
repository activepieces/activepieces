import path from 'path'
import { FastifyBaseLogger } from 'fastify'

const STACK_FRAME_RE = /at\s+(?:.+?\s+\()?([^\s()]+):(\d+):\d+\)?/

export const jobFailureLogger = {
    signatureOf(error: unknown): string {
        const errorName = readErrorName(error)
        const frame = readTopStackFrame(error)
        return frame ? `${errorName}@${frame}` : errorName
    },
    logJobFailed({ queueName, jobId, jobType, error, log }: LogJobFailedParams): void {
        const errorSignature = jobFailureLogger.signatureOf(error)
        log.error({
            queue: { name: queueName },
            job: { id: jobId ?? '', type: jobType },
            error,
            errorSignature,
        }, 'job.failed')
    },
}

function readErrorName(error: unknown): string {
    if (error instanceof Error) {
        const declared = error.name && error.name !== 'Error' ? error.name : undefined
        return declared ?? error.constructor?.name ?? 'Error'
    }
    return typeof error
}

function readTopStackFrame(error: unknown): string | null {
    if (!(error instanceof Error) || !error.stack) return null
    for (const line of error.stack.split('\n')) {
        const match = STACK_FRAME_RE.exec(line)
        if (!match) continue
        return `${path.basename(match[1])}:${match[2]}`
    }
    return null
}

type LogJobFailedParams = {
    queueName: string
    jobId: string | undefined
    jobType: string
    error: unknown
    log: FastifyBaseLogger
}
