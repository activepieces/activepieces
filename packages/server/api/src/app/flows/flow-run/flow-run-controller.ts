import {
    ActivepiecesError,
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
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { StatusCodes } from 'http-status-codes'
import { z } from 'zod'
import { ProjectResourceType } from '../../core/security/authorization/common'
import { securityAccess } from '../../core/security/authorization/fastify-security'
import { FlowRunEntity } from './flow-run-entity'
import { flowRunService } from './flow-run-service'

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


