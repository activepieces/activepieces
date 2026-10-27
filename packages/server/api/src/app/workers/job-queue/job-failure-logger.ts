import path from 'path'
import { tryCatchSync } from '@activepieces/core-utils'
import { FastifyBaseLogger } from 'fastify'

const STACK_FRAME_RE = /at\s+(?:.+?\s+\()?([^\s()]+):(\d+):\d+\)?/

export const jobFailureLogger = {
    signatureOf(error: unknown): string {
        const errorName = readErrorName(error)
        const frame = readTopStackFrame(error)
        return frame ? `${errorName}@${frame}` : errorName
    },
    signatureFromMessage(message: string, sourceLabel: string): string {
        const firstLine = message.split('\n', 1)[0].trim()
        const head = readJsonHead(firstLine) ?? readHead(firstLine)
        return `${sourceLabel}@${head || 'unknown'}`
    },
    logJobFailed({ queueName, jobId, jobType, error, log, signatureOverride }: LogJobFailedParams): void {
        const errorSignature = signatureOverride ?? jobFailureLogger.signatureOf(error)
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

function readHead(line: string): string {
    const colonIdx = line.indexOf(':')
    const head = colonIdx > 0 ? line.slice(0, colonIdx) : line
    return head.replace(/\s+/g, ' ').slice(0, 80)
}

function readJsonHead(line: string): string | null {
    if (!line.startsWith('{')) return null
    const { data } = tryCatchSync((): unknown => JSON.parse(line))
    if (typeof data !== 'object' || data === null) return null
    const code = 'code' in data ? data.code : undefined
    if (typeof code === 'string' || typeof code === 'number') {
        return String(code).slice(0, 80) || null
    }
    const message = 'message' in data ? data.message : undefined
    if (typeof message !== 'string') return null
    return readHead(message.split('\n', 1)[0].trim()) || null
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
    signatureOverride?: string
}
