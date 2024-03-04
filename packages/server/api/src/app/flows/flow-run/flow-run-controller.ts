import {
    FastifyPluginCallbackTypebox,
    Type,
} from '@fastify/type-provider-typebox'
import {
    ListFlowRunsRequestQuery,
    ApId,
    ALL_PRINCIPAL_TYPES,
    ExecutionType,
    SERVICE_KEY_SECURITY_OPENAPI,
    PrincipalType,
    FlowRun,
    SeekPage,
    assertNotNullOrUndefined,
} from '@activepieces/shared'
import {
    RetryFlowRequestBody,
} from '@activepieces/shared'
import { flowRunService } from './flow-run-service'
import { StatusCodes } from 'http-status-codes'

const DEFAULT_PAGING_LIMIT = 10

export const flowRunController: FastifyPluginCallbackTypebox = (
    app,
    _options,
    done,
): void => {
    app.get('/', ListRequest, async (request) => {
        // TODO project Id will be required after May 2024, this no longer needs to be optional
        const projectId = request.query.projectId ?? (request.principal.type === PrincipalType.SERVICE ? undefined : request.principal.projectId)
        assertNotNullOrUndefined(projectId, 'projectId')
        return flowRunService.list({
            projectId,
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

    app.all('/:id/requests/:requestId', ResumeFlowRunRequest, async (req) => {
        const headers = req.headers as Record<string, string>
        const queryParams = req.query as Record<string, string>
        await flowRunService.addToQueue({
            flowRunId: req.params.id,
            requestId: req.params.requestId,
            resumePayload: {
                body: req.body,
                headers,
                queryParams,
            },
            executionType: ExecutionType.RESUME,
        })
    })

    app.post('/:id/retry', RetryFlowRequest, async (req) => {
        await flowRunService.retry({
            flowRunId: req.params.id,
            strategy: req.query.strategy,
        })
    })

    done()
}

const FlowRunFiltered = Type.Omit(FlowRun, ['logsFileId', 'terminationReason', 'pauseMetadata'])

const ListRequest = {
    config: {
        allowedPrincipals: [PrincipalType.USER, PrincipalType.SERVICE],
    },
    schema: {
        tags: ['flow-runs'],
        description: 'List Flow Runs',
        security: [SERVICE_KEY_SECURITY_OPENAPI],
        querystring: ListFlowRunsRequestQuery,
        response: {
            [StatusCodes.OK]: SeekPage(Type.Omit(FlowRunFiltered, ['steps'])),
        },
    },
}

const GetRequest = {
    config: {
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
    schema: {
        params: Type.Object({
            id: ApId,
        }),
        querystring: RetryFlowRequestBody,
    },
}
