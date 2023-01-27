import { FastifyInstance, FastifyPluginOptions, FastifyRequest } from "fastify";
import {
  CreateFlowRequest,
  FlowId,
  FlowOperationRequest,
  FlowVersionId,
  ListFlowsRequest,
} from "@activepieces/shared";
import { StatusCodes } from "http-status-codes";
import { ActivepiecesError, ErrorCode } from "@activepieces/shared";
import { flowService } from "./flow.service";

const DEFUALT_PAGE_SIZE = 10;

export const flowController = async (fastify: FastifyInstance, options: FastifyPluginOptions) => {
  fastify.post(
    "/",
    {
      schema: {
        body: CreateFlowRequest
      },
    },
    async (
      request: FastifyRequest<{
        Body: CreateFlowRequest;
      }>,
      _reply
    ) => {
      return await flowService.create({ projectId: request.principal.projectId, request: request.body });
    }
  );

  fastify.post(
    "/:flowId",
    {
      schema: {
        body: FlowOperationRequest,
      },
    },
    async (
      request: FastifyRequest<{
        Params: {
          flowId: FlowId;
        };
        Body: FlowOperationRequest;
      }>,
      _reply
    ) => {
      const flow = await flowService.getOne({ id: request.params.flowId, versionId: undefined, projectId: request.principal.projectId });
      if (flow === null) {
        throw new ActivepiecesError({ code: ErrorCode.FLOW_NOT_FOUND, params: { id: request.params.flowId } });
      }
      return await flowService.update({ flowId: request.params.flowId, request: request.body, projectId: request.principal.projectId });
    }
  );

  fastify.get(
    "/",
    {
      schema: {
        querystring: ListFlowsRequest
      },
    },
    async (
      request: FastifyRequest<{
        Querystring: ListFlowsRequest;
      }>,
      _reply
    ) => {
      return await flowService.list({ projectId: request.principal.projectId, collectionId: request.query.collectionId, cursorRequest: request.query.cursor ?? null, limit: request.query.limit ?? DEFUALT_PAGE_SIZE });
    }
  );

  fastify.get(
    "/:flowId",
    async (
      request: FastifyRequest<{
        Params: {
          flowId: FlowId;
        };
        Querystring: {
          versionId: FlowVersionId | undefined;
        };
      }>,
      _reply
    ) => {
      const versionId: FlowVersionId | undefined = request.query.versionId;
      const flow = await flowService.getOne({ id: request.params.flowId, versionId: versionId, projectId: request.principal.projectId });
      if (flow === null) {
        throw new ActivepiecesError({ code: ErrorCode.FLOW_NOT_FOUND, params: { id: request.params.flowId } });
      }
      return flow;
    }
  );

  fastify.delete(
    "/:flowId",
    async (
      request: FastifyRequest<{
        Params: {
          flowId: FlowId;
        };
      }>,
      _reply
    ) => {
      await flowService.delete({ projectId: request.principal.projectId, flowId: request.params.flowId });
      _reply.status(StatusCodes.OK).send();
    }
  );
};
