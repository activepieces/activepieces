import {
    ALL_PRINCIPAL_TYPES,
    apId,
    ApId,
} from '@activepieces/shared'
import { FastifyBaseLogger, FastifyReply } from 'fastify'
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { securityAccess } from '../../../core/security/authorization/fastify-security'
import { resumeService } from './resume-service'
import { waitpointService } from './waitpoint-service'

/**
 * @deprecated Deprecated since 2026-04-12. Scheduled for removal after 2026-10-12.
 * These endpoints exist for backward compatibility with the legacy pauseMetadata-based resume flow.
 * New integrations should use the waitpoint API instead.
 */
export const legacyResumeController: FastifyPluginAsyncZod = async (app) => {
    app.all('/:id/requests/:requestId', ResumeFlowRunRequest, async (req, reply) => {
        const waitpoint = await waitpointService(req.log).getByFlowRunId(req.params.id)
        const headers = req.headers as Record<string, string>
        const queryParams = req.query as Record<string, string>
        await handleAsyncResume({ flowRunId: req.params.id, waitpointId: waitpoint?.id ?? apId(), body: req.body, headers, queryParams, log: req.log, reply })
    })

    app.all('/:id/requests/:requestId/sync', ResumeFlowRunRequest, async (req, reply) => {
        const waitpoint = await waitpointService(req.log).getByFlowRunId(req.params.id)
        const headers = req.headers as Record<string, string>
        const queryParams = req.query as Record<string, string>
        await handleSyncResume({ flowRunId: req.params.id, waitpointId: waitpoint?.id ?? apId(), body: req.body, headers, queryParams, log: req.log, reply, correlationId: req.params.requestId })
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

async function handleAsyncResume({ flowRunId, waitpointId, body, headers, queryParams, log, reply }: ResumeHandlerParams): Promise<void> {
    const { stale } = await resumeService(log).resumeFromWaitpoint({
        flowRunId,
        waitpointId,
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

async function handleSyncResume({ flowRunId, waitpointId, body, headers, queryParams, log, reply, correlationId }: ResumeHandlerParams & { correlationId: string }): Promise<void> {
    const response = await resumeService(log).handleSyncResumeFlow({
        runId: flowRunId,
        waitpointId,
        payload: {
            body,
            headers,
            queryParams,
        },
        correlationId,
    })
    await reply.status(response.status).headers(response.headers).send(response.body)
}

type ResumeHandlerParams = {
    flowRunId: string
    waitpointId: string
    body: unknown
    headers: Record<string, string>
    queryParams: Record<string, string>
    log: FastifyBaseLogger
    reply: FastifyReply
}
