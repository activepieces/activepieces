import { FastifyPluginCallback, FastifyReply, FastifyRequest } from "fastify";
import { CreateFlowRunRequest, FlowRunId, ListFlowRunsRequest, RunEnvironment } from "@activepieces/shared";
import { ActivepiecesError, ErrorCode } from "@activepieces/shared";
import { flowRunService, flowRunService as service } from "./flow-run-service";

const DEFAULT_PAGING_LIMIT = 10;


interface GetOnePathParams {
    id: FlowRunId;
}

export const flowRunController: FastifyPluginCallback = (app, _options, done): void => {

    app.post(
        "/",
        {
            schema: {
                body: CreateFlowRunRequest,
            },
        },
        async (request: FastifyRequest<{ Body: CreateFlowRunRequest }>, reply: FastifyReply) => {
            const { flowVersionId, collectionId, payload } = request.body;
            const flowRun = await flowRunService.start({
                environment: RunEnvironment.TESTING,
                flowVersionId,
                collectionId,
                payload,
            });

            await reply.send(flowRun);
        }
    );

    // list
    app.get("/", {
        schema: ListFlowRunsRequest
    }, async (request: FastifyRequest<{ Querystring: ListFlowRunsRequest }>, reply: FastifyReply) => {
        const flowRunPage = await service.list({
            projectId: request.principal.projectId,
            cursor: request.query.cursor ?? null,
            limit: Number(request.query.limit ?? DEFAULT_PAGING_LIMIT),
        });

        await reply.send(flowRunPage);
    });

    // get one
    app.get("/:id", async (request: FastifyRequest<{ Params: GetOnePathParams }>, reply: FastifyReply) => {
        const flowRun = await service.getOne({
            projectId: request.principal.projectId,
            id: request.params.id,
        });

        if (flowRun == null) {
            throw new ActivepiecesError({
                code: ErrorCode.FLOW_RUN_NOT_FOUND,
                params: {
                    id: request.params.id,
                },
            });
        }

        await reply.send(flowRun);
    });

    done();
};
