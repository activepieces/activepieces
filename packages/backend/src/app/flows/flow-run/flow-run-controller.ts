import { FastifyReply, FastifyRequest } from 'fastify'
import { FastifyPluginCallbackTypebox } from '@fastify/type-provider-typebox'
import { CreateFlowRunRequest, FlowRunId, ListFlowRunsRequestQuery, RunEnvironment } from '@activepieces/shared'
import { ActivepiecesError, ErrorCode } from '@activepieces/shared'
import { flowRunService } from './flow-run-service'

const DEFAULT_PAGING_LIMIT = 10


type GetOnePathParams = {
    id: FlowRunId
}

export const flowRunController: FastifyPluginCallbackTypebox = (app, _options, done): void => {

    app.post(
        '/',
        {
            schema: {
                body: CreateFlowRunRequest,
            },
        },
        async (request: FastifyRequest<{ Body: CreateFlowRunRequest }>, reply: FastifyReply) => {
            const { flowVersionId, payload } = request.body
            const flowRun = await flowRunService.start({
                environment: RunEnvironment.TESTING,
                flowVersionId,
                payload,
            })

            await reply.send(flowRun)
        },
    )

    // list
    app.get('/', {
        schema: {
            querystring: ListFlowRunsRequestQuery,
        },
    }, async (request, reply) => {
        const flowRunPage = await flowRunService.list({
            projectId: request.principal.projectId,
            flowId: request.query.flowId,
            status: request.query.status,
            cursor: request.query.cursor ?? null,
            limit: Number(request.query.limit ?? DEFAULT_PAGING_LIMIT),
        })

        await reply.send(flowRunPage)
    })

    // get one
    app.get('/:id', async (request: FastifyRequest<{ Params: GetOnePathParams }>, reply: FastifyReply) => {
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
    })

    done()
}
