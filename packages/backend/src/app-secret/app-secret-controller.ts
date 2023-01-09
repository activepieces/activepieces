import { FastifyInstance, FastifyPluginOptions, FastifyRequest } from "fastify";
import {
  AppSecretId,
  ListAppRequest,
  ListFlowsRequest,
  ListFlowsSchema,
  UpsertAppSecretRequest,
} from "shared";
import { StatusCodes } from "http-status-codes";
import { ActivepiecesError, ErrorCode } from "../helper/activepieces-error";
import { appSecretService } from "./app-secret-service";


export const appSecretController = async (fastify: FastifyInstance, options: FastifyPluginOptions) => {
  fastify.post(
    "/",
    {
      schema: UpsertAppSecretRequest,
    },
    async (
      request: FastifyRequest<{
        Body: UpsertAppSecretRequest;
      }>,
      _reply
    ) => {
      return await appSecretService.upsert(request.body);
    }
  );


  fastify.get(
    "/:appSecretId",
    async (
      request: FastifyRequest<{
        Params: {
          appSecretId: AppSecretId;
        };
      }>,
      _reply
    ) => {
      const appSecret = await appSecretService.getOne(request.params.appSecretId);
      if (appSecret === null) {
        throw new ActivepiecesError({
          code: ErrorCode.APP_SECRET_NOT_FOUND,
          params: { appSecretId: request.params.appSecretId },
        });
      }
      return appSecret;
    }
  );

  fastify.get(
    "/",
    {
      schema: ListAppRequest,
    },
    async (
      request: FastifyRequest<{
        Querystring: ListAppRequest;
      }>,
      _reply
    ) => {
      return await appSecretService.list(request.query.projectId, request.query.cursor, request.query.limit);
    }
  );

  fastify.delete(
    "/:appSecretId",
    async (
      request: FastifyRequest<{
        Params: {
          appSecretId: AppSecretId;
        };
      }>,
      _reply
    ) => {
      await appSecretService.delete(request.params.appSecretId);
      _reply.status(StatusCodes.OK).send();
    }
  );
};
