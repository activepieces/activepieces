import { FastifyReply, FastifyRequest } from 'fastify'
import {
    FastifyPluginCallbackTypebox,
    Type,
} from '@fastify/type-provider-typebox'
import {
    FlowRunId,
    ListFlowRunsRequestQuery,
    ApId,
    ALL_PRINICPAL_TYPES,
    ExecutionType,
} from '@activepieces/shared'
import {
    ActivepiecesError,
    ErrorCode,
    RetryFlowRequestBody,
} from '@activepieces/shared'
import { flowRunService } from './flow-run-service'

const DEFAULT_PAGING_LIMIT = 10

type GetOnePathParams = {
    id: FlowRunId
}

const ResumeFlowRunRequest = {
    config: {
        allowedPrincipals: ALL_PRINICPAL_TYPES,
    },
    schema: {
        params: Type.Object({
            id: ApId,
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

export const flowRunController: FastifyPluginCallbackTypebox = (
    app,
    _options,
    done,
): void => {
    // list
    app.get('/', ListRequest, async (request, reply) => {
        const flowRunPage = await flowRunService.list({
            projectId: request.principal.projectId,
            flowId: request.query.flowId,
            tags: request.query.tags,
            status: request.query.status,
            cursor: request.query.cursor ?? null,
            limit: Number(request.query.limit ?? DEFAULT_PAGING_LIMIT),
            createdAfter: request.query.createdAfter,
            createdBefore: request.query.createdBefore,
        })

        await reply.send(flowRunPage)
    })

    // get one
    app.get(
        '/:id',
        async (
            request: FastifyRequest<{ Params: GetOnePathParams }>,
            reply: FastifyReply,
        ) => {
            const flowRun = await flowRunService.getOne({
                projectId: request.principal.projectId,
                id: request.params.id,
            })

            if (flowRun == null) {
                throw new ActivepiecesError({
                    code: ErrorCode.FLOW_RUN_NOT_FOUND,
                    params: {
                        id: request.params.id,
                    },
                })
            }

            await reply.send(flowRun)
        },
    )

    app.all('/:id/resume', ResumeFlowRunRequest, async (req) => {
        const headers = req.headers as Record<string, string>
        const queryParams = req.query as Record<string, string>
        await flowRunService.addToQueue({
            flowRunId: req.params.id,
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

const ListRequest = {
    schema: {
        querystring: ListFlowRunsRequestQuery,
    },
}
