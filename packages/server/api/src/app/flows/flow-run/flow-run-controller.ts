import { ProjectResourceType, securityAccess } from '@activepieces/server-shared'
import {
    ActivepiecesError,
    ALL_PRINCIPAL_TYPES,
    ApId,
    BulkActionOnRunsRequestBody,
    BulkArchiveActionOnRunsRequestBody,
    BulkCancelFlowRequestBody,
    ErrorCode,
    ExecutionType,
    FlowRun,
    isNil,
    ListFlowRunsRequestQuery,
    Permission,
    PrincipalType,
    ProgressUpdateType,
    RetryFlowRequestBody,
    SeekPage,
    SERVICE_KEY_SECURITY_OPENAPI,
} from '@activepieces/shared'
import {
    FastifyPluginAsyncTypebox,
    Type,
} from '@fastify/type-provider-typebox'
import { StatusCodes } from 'http-status-codes'
import { FlowRunEntity } from './flow-run-entity'
import { flowRunService } from './flow-run-service'

const DEFAULT_PAGING_LIMIT = 10

export const flowRunController: FastifyPluginAsyncTypebox = async (app) => {
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

    app.all('/:id/requests/:requestId', ResumeFlowRunRequest, async (req, reply) => {
        const headers = req.headers as Record<string, string>
        const queryParams = req.query as Record<string, string>
        await flowRunService(req.log).resume({
            flowRunId: req.params.id,
            requestId: req.params.requestId,
            payload: {
                body: req.body,
                headers,
                queryParams,
            },
            checkRequestId: true,
            progressUpdateType: ProgressUpdateType.TEST_FLOW,
            executionType: ExecutionType.RESUME,
        })
        await reply.send({
            message: 'Your response has been recorded. You can close this page now.',
        })
    })

    app.all('/:id/requests/:requestId/sync', ResumeFlowRunRequest, async (req, reply) => {
        const headers = req.headers as Record<string, string>
        const queryParams = req.query as Record<string, string>
        const response = await flowRunService(req.log).handleSyncResumeFlow({
            runId: req.params.id,
            payload: {
                body: req.body,
                headers,
                queryParams,
            },
            requestId: req.params.requestId,
        })
        await reply.status(response.status).headers(response.headers).send(response.body)
    })

    app.post('/:id/retry', RetryFlowRequest, async (req) => {
        const flowRun = await flowRunService(req.log).retry({
            flowRunId: req.params.id,
            strategy: req.body.strategy,
            projectId: req.body.projectId,
        })

        if (isNil(flowRun)) {
            throw new ActivepiecesError({
                code: ErrorCode.FLOW_RUN_NOT_FOUND,
                params: {
                    id: req.params.id,
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

const FlowRunFiltered = Type.Omit(FlowRun, ['pauseMetadata'])
const FlowRunFilteredWithNoSteps = Type.Omit(FlowRun, ['pauseMetadata', 'steps'])

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
        params: Type.Object({
            id: ApId,
        }),
        response: {
            [StatusCodes.OK]: FlowRunFiltered,
        },
    },
}

const ResumeFlowRunRequest = {
    config: {
        security: securityAccess.unscoped(ALL_PRINCIPAL_TYPES),
    },
    schema: {
        params: Type.Object({
            id: ApId,
            requestId: Type.String(),
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
        params: Type.Object({
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