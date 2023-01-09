import { FastifyInstance, FastifyPluginOptions, FastifyRequest } from "fastify";
import { StatusCodes } from "http-status-codes";
import { AppConnectionId, ListAppConnectionRequest, UpsertConnectionRequest } from "shared";
import { ActivepiecesError, ErrorCode } from "../helper/activepieces-error";
import { appConnectionService } from "./app-connection-service";

export const appConnectionController = async (fastify: FastifyInstance, options: FastifyPluginOptions) => {
    fastify.post(
      "/",
      {
        schema: UpsertConnectionRequest,
      },
      async (
        request: FastifyRequest<{
          Body: UpsertConnectionRequest;
        }>,
        _reply
      ) => {
        return await appConnectionService.upsert(request.body);
      }
    );
  
  
    fastify.get(
      "/:connectionId",
      async (
        request: FastifyRequest<{
          Params: {
            connectionId: AppConnectionId;
          };
        }>,
        _reply
      ) => {
        const appSecret = await appConnectionService.getOne(request.params.connectionId);
        if (appSecret === null) {
          throw new ActivepiecesError({
            code: ErrorCode.APP_SECRET_NOT_FOUND,
            params: { appSecretId: request.params.connectionId },
          });
        }
        return appSecret;
      }
    );
  
    fastify.get(
      "/",
      {
        schema: ListAppConnectionRequest,
      },
      async (
        request: FastifyRequest<{
          Querystring: ListAppConnectionRequest;
        }>,
        _reply
      ) => {
        return await appConnectionService.list(request.query.appSecretId, request.query.cursor, request.query.limit);
      }
    );
  
    fastify.delete(
      "/:connectionId",
      async (
        request: FastifyRequest<{
          Params: {
            connectionId: AppConnectionId;
          };
        }>,
        _reply
      ) => {
        await appConnectionService.delete(request.params.connectionId);
        _reply.status(StatusCodes.OK).send();
      }
    );
  };
  