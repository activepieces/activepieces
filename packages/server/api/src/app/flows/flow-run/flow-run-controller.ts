import {
    ActivepiecesError,
    ALL_PRINCIPAL_TYPES,
    ApId,
    BulkRetryFlowRequestBody,
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
import { flowRunService } from './flow-run-service'

const DEFAULT_PAGING_LIMIT = 10

export const flowRunController: FastifyPluginAsyncTypebox = async (app) => {
    app.get('/', ListRequest, async (request) => {
        return flowRunService.list({
            projectId: request.query.projectId,
            flowId: request.query.flowId,
            tags: request.query.tags,
            status: request.query.status,
            cursor: request.query.cursor ?? null,
            limit: Number(request.query.limit ?? DEFAULT_PAGING_LIMIT),
            createdAfter: request.query.createdAfter,
            createdBefore: request.query.createdBefore,
        })
    })

    app.get(
        '/:id',
        GetRequest,
        async (request, reply) => {
            const flowRun = await flowRunService.getOnePopulatedOrThrow({
                projectId: request.principal.projectId,
                id: request.params.id,
            })
            await reply.send(flowRun)
        },
    )

    app.all('/:id/requests/:requestId', ResumeFlowRunRequest, async (req, reply) => {
        const headers = req.headers as Record<string, string>
        const queryParams = req.query as Record<string, string>
        await flowRunService.addToQueue({
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

    app.post('/:id/retry', RetryFlowRequest, async (req) => {
        const flowRun = await flowRunService.retry({
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

    app.post('/retry', BulkRetryFlowRequest, async (req) => {
        return flowRunService.bulkRetry({
            projectId: req.principal.projectId,
            flowRunIds: req.body.flowRunIds,
            strategy: req.body.strategy,
            status: req.body.status,
            flowId: req.body.flowId,
            createdAfter: req.body.createdAfter,
            createdBefore: req.body.createdBefore,
        })
    })

}

const FlowRunFiltered = Type.Omit(FlowRun, ['terminationReason', 'pauseMetadata'])
const FlowRunFilteredWithNoSteps = Type.Omit(FlowRun, ['terminationReason', 'pauseMetadata', 'steps'])

const ListRequest = {
    config: {
        permission: Permission.READ_RUN,
        allowedPrincipals: [PrincipalType.USER, PrincipalType.SERVICE],
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
        permission: Permission.READ_RUN,
        allowedPrincipals: [PrincipalType.SERVICE, PrincipalType.USER],
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
        allowedPrincipals: ALL_PRINCIPAL_TYPES,
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
        permission: Permission.WRITE_RUN,
    },
    schema: {
        params: Type.Object({
            id: ApId,
        }),
        body: RetryFlowRequestBody,
    },
}

const BulkRetryFlowRequest = {
    config: {
        permission: Permission.WRITE_RUN,
    },
    schema: {
        body: BulkRetryFlowRequestBody,
    },
}