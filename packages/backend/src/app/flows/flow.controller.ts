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
import { flowService } from "./flow-service";

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
      _request: FastifyRequest<{
        Body: CreateFlowRequest;
      }>,
      _reply
    ) => {
      return await flowService.create(_request.body);
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
      const flow = await flowService.getOne(request.params.flowId, undefined);
      if (flow === null) {
        throw new ActivepiecesError({ code: ErrorCode.FLOW_NOT_FOUND, params: { id: request.params.flowId } });
      }
      return await flowService.update(request.params.flowId, request.body);
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
      _request: FastifyRequest<{
        Querystring: ListFlowsRequest;
      }>,
      _reply
    ) => {
      return await flowService.list(_request.query.collectionId, _request.query.cursor, _request.query.limit??DEFUALT_PAGE_SIZE);
    }
  );

  fastify.get(
    "/:flowId",
    async (
      _request: FastifyRequest<{
        Params: {
          flowId: FlowId;
        };
        Querystring: {
          versionId: FlowVersionId | undefined;
        };
      }>,
      _reply
    ) => {
      const versionId: FlowVersionId | undefined = _request.query.versionId;
      const flow = await flowService.getOne(_request.params.flowId, versionId);
      if (flow === null) {
        throw new ActivepiecesError({ code: ErrorCode.FLOW_NOT_FOUND, params: { id: _request.params.flowId } });
      }
      return flow;
    }
  );

  fastify.delete(
    "/:flowId",
    async (
      _request: FastifyRequest<{
        Params: {
          flowId: FlowId;
        };
      }>,
      _reply
    ) => {
      await flowService.delete(_request.params.flowId);
      _reply.status(StatusCodes.OK).send();
    }
  );
};
