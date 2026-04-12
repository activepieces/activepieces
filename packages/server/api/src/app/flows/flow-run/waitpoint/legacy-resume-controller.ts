import {
    ALL_PRINCIPAL_TYPES,
    ApId,
} from '@activepieces/shared'
import { FastifyBaseLogger, FastifyReply } from 'fastify'
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { securityAccess } from '../../../core/security/authorization/fastify-security'
import { legacyResumeService } from './legacy-resume-service'

/**
 * @deprecated Deprecated since 2026-04-12. Scheduled for removal after 2026-10-12.
 * These endpoints exist for backward compatibility with the legacy pauseMetadata-based resume flow.
 * New integrations should use the waitpoint API instead.
 */
export const legacyResumeController: FastifyPluginAsyncZod = async (app) => {
    app.all('/:id/requests/:requestId', ResumeFlowRunRequest, async (req, reply) => {
        const headers = req.headers as Record<string, string>
        const queryParams = req.query as Record<string, string>
        await handleAsyncResume({ flowRunId: req.params.id, body: req.body, headers, queryParams, log: req.log, reply })
    })

    app.all('/:id/requests/:requestId/sync', ResumeFlowRunRequest, async (req, reply) => {
        const headers = req.headers as Record<string, string>
        const queryParams = req.query as Record<string, string>
        await handleSyncResume({ flowRunId: req.params.id, body: req.body, headers, queryParams, log: req.log, reply, correlationId: req.params.requestId })
    })
}

const ResumeFlowRunRequest = {
    config: {
        security: securityAccess.unscoped(ALL_PRINCIPAL_TYPES),
    },
    schema: {
        params: z.object({
            id: ApId,
            requestId: z.string(),
        }),
    },
}

async function handleAsyncResume({ flowRunId, body, headers, queryParams, log, reply }: ResumeHandlerParams): Promise<void> {
    const { stale } = await legacyResumeService(log).resumeAsync({
        flowRunId,
        resumePayload: { body, headers, queryParams },
    })
    if (stale) {
        await reply.send({
            message: 'This link has expired. The action may have already been processed.',
        })
        return
    }
    await reply.send({
        message: 'Your response has been recorded. You can close this page now.',
    })
}

async function handleSyncResume({ flowRunId, body, headers, queryParams, log, reply, correlationId }: ResumeHandlerParams & { correlationId: string }): Promise<void> {
    const response = await legacyResumeService(log).resumeSync({
        flowRunId,
        resumePayload: { body, headers, queryParams },
        correlationId,
    })
    await reply.status(response.status).headers(response.headers).send(response.body)
}

type ResumeHandlerParams = {
    flowRunId: string
    body: unknown
    headers: Record<string, string>
    queryParams: Record<string, string>
    log: FastifyBaseLogger
    reply: FastifyReply
}
