import {
    ActivepiecesError,
    ALL_PRINCIPAL_TYPES,
    apId,
    ApId,
    BulkActionOnRunsRequestBody,
    BulkArchiveActionOnRunsRequestBody,
    BulkCancelFlowRequestBody,
    ErrorCode,
    FlowRun,
    isNil,
    ListFlowRunsRequestQuery,
    Permission,
    PrincipalType,
    RetryFlowRequestBody,
    RunEnvironment,
    SeekPage,
    SERVICE_KEY_SECURITY_OPENAPI,
} from '@activepieces/shared'
import { FastifyBaseLogger, FastifyReply } from 'fastify'
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { StatusCodes } from 'http-status-codes'
import { z } from 'zod'
import { ProjectResourceType } from '../../core/security/authorization/common'
import { securityAccess } from '../../core/security/authorization/fastify-security'
import { FlowRunEntity } from './flow-run-entity'
import { flowRunService } from './flow-run-service'
import { waitpointService } from './waitpoint/waitpoint-service'

const DEFAULT_PAGING_LIMIT = 10

export const flowRunController: FastifyPluginAsyncZod = async (app) => {
    app.get('/', ListRequest, async (request) => {
        return flowRunService(request.log).list({
            projectId: request.query.projectId,
            flowId: request.query.flowId,
            tags: request.query.tags,
            status: request.query.status,
            failedStepName: request.query.failedStepName,
            cursor: request.query.cursor ?? null,
            limit: Number(request.query.limit ?? DEFAULT_PAGING_LIMIT),
            createdAfter: request.query.createdAfter,
            createdBefore: request.query.createdBefore,
            flowRunIds: request.query.flowRunIds,
            includeArchived: request.query.includeArchived,
            environment: RunEnvironment.PRODUCTION,
        })
    })

    app.get(
        '/:id',
        GetRequest,
        async (request, reply) => {
            const flowRun = await flowRunService(request.log).getOnePopulatedOrThrow({
                projectId: request.projectId,
                id: request.params.id,
            })
            await reply.send(flowRun)
        },
    )

    app.all('/:id/waitpoints/:waitpointId', ResumeByWaitpointRequest, async (req, reply) => {
        const headers = req.headers as Record<string, string>
        const queryParams = req.query as Record<string, string>
        await handleAsyncResume({ flowRunId: req.params.id, waitpointId: req.params.waitpointId, body: req.body, headers, queryParams, log: req.log, reply })
    })

    app.all('/:id/waitpoints/:waitpointId/sync', ResumeByWaitpointRequest, async (req, reply) => {
        const headers = req.headers as Record<string, string>
        const queryParams = req.query as Record<string, string>
        await handleSyncResume({ flowRunId: req.params.id, waitpointId: req.params.waitpointId, body: req.body, headers, queryParams, log: req.log, reply, correlationId: req.params.waitpointId })
    })

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

    app.post('/:id/retry', RetryFlowRequest, async (req) => {
        const flowRun = await flowRunService(req.log).retry({
            flowRunId: req.params.id,
            strategy: req.body.strategy,
            projectId: req.body.projectId,
        })

        if (isNil(flowRun)) {
            throw new ActivepiecesError({
                code: ErrorCode.ENTITY_NOT_FOUND,
                params: {
                    entityType: 'flow_run',
                    entityId: req.params.id,
                    message: 'Flow run not found',
                },
            })
        }
        return flowRun
    })

    app.post('/cancel', BulkCancelFlowRequest, async (req) => {
        return flowRunService(req.log).cancel({
            projectId: req.projectId,
            platformId: req.principal.platform.id,
            flowRunIds: req.body.flowRunIds,
            excludeFlowRunIds: req.body.excludeFlowRunIds,
            status: req.body.status,
            flowId: req.body.flowId,
            createdAfter: req.body.createdAfter,
            createdBefore: req.body.createdBefore,
        })
    })

    app.post('/retry', BulkRetryFlowRequest, async (req) => {
        return flowRunService(req.log).bulkRetry({
            projectId: req.projectId,
            flowRunIds: req.body.flowRunIds,
            excludeFlowRunIds: req.body.excludeFlowRunIds,
            strategy: req.body.strategy,
            status: req.body.status,
            flowId: req.body.flowId,
            createdAfter: req.body.createdAfter,
            createdBefore: req.body.createdBefore,
            failedStepName: req.body.failedStepName,
        })
    })

    app.post('/archive', ArchiveFlowRunRequest, async (req) => {
        return flowRunService(req.log).bulkArchive({
            projectId: req.projectId,
            flowRunIds: req.body.flowRunIds,
            excludeFlowRunIds: req.body.excludeFlowRunIds,
            status: req.body.status,
            flowId: req.body.flowId,
            createdAfter: req.body.createdAfter,
            createdBefore: req.body.createdBefore,
            failedStepName: req.body.failedStepName,
        })
    })

}

const FlowRunFilteredWithNoSteps = FlowRun.omit({ steps: true })

const ListRequest = {
    config: {
        security: securityAccess.project(
            [PrincipalType.USER, PrincipalType.SERVICE], 
            Permission.READ_RUN, {
                type: ProjectResourceType.QUERY,
            }),
    },
    schema: {
        tags: ['flow-runs'],
        description: 'List Flow Runs',
        security: [SERVICE_KEY_SECURITY_OPENAPI],
        querystring: ListFlowRunsRequestQuery,
        response: {
            [StatusCodes.OK]: SeekPage(FlowRunFilteredWithNoSteps),
        },
    },
}

const GetRequest = {
    config: {
        security: securityAccess.project(
            [PrincipalType.USER, PrincipalType.SERVICE], 
            Permission.READ_RUN, {
                type: ProjectResourceType.TABLE,
                tableName: FlowRunEntity,
            }),
    },
    schema: {
        tags: ['flow-runs'],
        description: 'Get Flow Run',
        security: [SERVICE_KEY_SECURITY_OPENAPI],
        params: z.object({
            id: ApId,
        }),
        response: {
            [StatusCodes.OK]: FlowRun,
        },
    },
}

const ResumeByWaitpointRequest = {
    config: {
        security: securityAccess.unscoped(ALL_PRINCIPAL_TYPES),
    },
    schema: {
        params: z.object({
            id: ApId,
            waitpointId: z.string(),
        }),
    },
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

const RetryFlowRequest = {
    config: {
        security: securityAccess.project(
            [PrincipalType.USER, PrincipalType.SERVICE], 
            Permission.WRITE_RUN, {
                type: ProjectResourceType.TABLE,
                tableName: FlowRunEntity,
            }),
    },
    schema: {
        params: z.object({
            id: ApId,
        }),
        body: RetryFlowRequestBody,
    },
}

const BulkCancelFlowRequest = {
    config: {
        security: securityAccess.project(
            [PrincipalType.USER, PrincipalType.SERVICE], 
            Permission.WRITE_RUN, {
                type: ProjectResourceType.BODY,
            }),
    },
    schema: {
        tags: ['flow-runs'],
        description: 'Cancel multiple paused/queued flow runs',
        security: [SERVICE_KEY_SECURITY_OPENAPI],
        body: BulkCancelFlowRequestBody,
    },
}

const ArchiveFlowRunRequest = {
    config: {
        security: securityAccess.project(
            [PrincipalType.USER, PrincipalType.SERVICE], 
            Permission.WRITE_RUN, {
                type: ProjectResourceType.BODY,
            }),
    },
    schema: {
        body: BulkArchiveActionOnRunsRequestBody,
    },
}

const BulkRetryFlowRequest = {
    config: {
        security: securityAccess.project(
            [PrincipalType.USER, PrincipalType.SERVICE],
            Permission.WRITE_RUN, {
                type: ProjectResourceType.BODY,
            }),
    },
    schema: {
        body: BulkActionOnRunsRequestBody,
    },
}

async function handleAsyncResume({ flowRunId, waitpointId, body, headers, queryParams, log, reply }: ResumeHandlerParams): Promise<void> {
    const { stale } = await flowRunService(log).resumeFromWaitpoint({
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
    const response = await flowRunService(log).handleSyncResumeFlow({
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