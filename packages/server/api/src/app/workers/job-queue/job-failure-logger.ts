import path from 'path'
import { tryCatchSync } from '@activepieces/core-utils'
import { FastifyBaseLogger } from 'fastify'
import { z } from 'zod'

const STACK_FRAME_RE = /at\s+(?:.+?\s+\()?([^\s()]+):(\d+):\d+\)?/
const JsonErrorCode = z.object({ code: z.union([z.string().min(1), z.number()]) })

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
    const parsed = JsonErrorCode.safeParse(data)
    return parsed.success ? String(parsed.data.code).slice(0, 80) : null
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
