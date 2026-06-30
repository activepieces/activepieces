import { PrincipalType } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { StatusCodes } from 'http-status-codes'
import { z } from 'zod'
import { securityAccess } from '../../core/security/authorization/fastify-security'

// Keys that evlog / wide-event / the request middleware own; a client must never
// be allowed to overwrite them, so they are dropped before re-emitting.
const RESERVED_KEYS = new Set(['service', 'version', 'level', 'msg', 'timestamp', 'error', 'timings', 'requestId', 'traceId', 'method', 'path', 'source'])

function resolveLevel(value: unknown): 'debug' | 'info' | 'warn' | 'error' {
    switch (value) {
        case 'debug':
        case 'warn':
        case 'error':
            return value
        default:
            return 'info'
    }
}

function emitClientEvent(log: FastifyBaseLogger, event: Record<string, unknown>): void {
    const level = resolveLevel(event.level)
    const message = typeof event.msg === 'string' ? event.msg : 'client event'
    const clientTimestamp = typeof event.timestamp === 'string' ? event.timestamp : undefined
    const fields: Record<string, unknown> = { source: 'client' }
    if (clientTimestamp !== undefined) {
        fields.clientTimestamp = clientTimestamp
    }
    for (const [key, value] of Object.entries(event)) {
        if (!RESERVED_KEYS.has(key)) {
            fields[key] = value
        }
    }
    log[level](fields, message)
}

export const clientLogsController: FastifyPluginAsyncZod = async (app) => {
    app.post('/client', IngestClientLogsRequest, async (request, reply) => {
        for (const event of request.body.events) {
            emitClientEvent(request.log, event)
        }
        return reply.status(StatusCodes.NO_CONTENT).send()
    })
}

const IngestClientLogsRequest = {
    config: {
        security: securityAccess.publicPlatform([PrincipalType.USER]),
    },
    schema: {
        tags: ['logs'],
        body: z.object({
            events: z.array(z.record(z.string(), z.unknown())).max(500),
        }),
    },
}
