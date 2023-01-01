import { FastifyInstance, FastifyPluginOptions, FastifyReply, FastifyRequest } from "fastify";
import { CreateFlowRunRequest, Cursor, FlowRunId, ProjectId } from "shared";
import { ActivepiecesError, ErrorCode } from "../helper/activepieces-error";
import { flowRunService, flowRunService as service } from "./flow-run-service";

const DEFAULT_PAGING_LIMIT = 10;

interface ListQueryParams {
  projectId: ProjectId;
  cursor: Cursor | undefined;
  limit: number | undefined;
}

interface GetOnePathParams {
  id: FlowRunId;
}

export const flowRunController = (app: FastifyInstance, _options: FastifyPluginOptions): void => {
  // create one
  app.post(
    "/",
    {
      schema: {
        body: CreateFlowRunRequest,
      },
    },
    async (request: FastifyRequest<{ Body: CreateFlowRunRequest }>, reply: FastifyReply) => {
      const { flowVersionId, collectionVersionId, payload } = request.body;

      const flowRun = await flowRunService.start({
        instanceId: null,
        flowVersionId,
        collectionVersionId,
        payload,
      });

      await reply.send(flowRun);
    }
  );

  // list
  app.get("/", async (request: FastifyRequest<{ Querystring: ListQueryParams }>, reply: FastifyReply) => {
    const flowRunPage = await service.list({
      projectId: request.query.projectId,
      cursor: request.query.cursor ?? null,
      limit: Number(request.query.limit ?? DEFAULT_PAGING_LIMIT),
    });

    await reply.send(flowRunPage);
  });

  // get one
  app.get("/:id", async (request: FastifyRequest<{ Params: GetOnePathParams }>, reply: FastifyReply) => {
    const flowRun = await service.getOne({
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
};
