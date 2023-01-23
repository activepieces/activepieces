import { FastifyInstance, FastifyPluginOptions, FastifyRequest } from "fastify";
import { StatusCodes } from "http-status-codes";
import { AppConnectionId, getAppConnectionRequest, ListAppConnectionRequest, ProjectId, UpsertConnectionRequest } from "@activepieces/shared";
import { ActivepiecesError, ErrorCode } from "@activepieces/shared";
import { appConnectionService } from "./app-connection-service";

const DEFAULT_PAGE_SIZE = 10;
export const appConnectionController = async (fastify: FastifyInstance, options: FastifyPluginOptions) => {

  fastify.post(
    "/",
    {
      schema: {
        body: UpsertConnectionRequest
      }
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
    "/:connectionName",
    {
      schema: {

        querystring: getAppConnectionRequest
      }
    }
    ,
    async (
      request: FastifyRequest<{
        Querystring: getAppConnectionRequest,
        Params: {
          connectionName: string;
        };
      }>,
      _reply
    ) => {
      const appCredential = await appConnectionService.getOne(request.query.projectId, request.params.connectionName);
      if (appCredential === null) {
        throw new ActivepiecesError({
          code: ErrorCode.APP_CONNECTION_NOT_FOUND,
          params: { id: request.params.connectionName },
        });
      }
      return appCredential;
    }
  );

  fastify.get(
    "/",
    {
      schema: {
        querystring: ListAppConnectionRequest
      },
    },
    async (
      request: FastifyRequest<{
        Querystring: ListAppConnectionRequest;
      }>,
      _reply
    ) => {
      const query = request.query;
      return await appConnectionService.list(query.projectId,
        query.appName,
        query.cursor ?? null, query.limit ?? DEFAULT_PAGE_SIZE);
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
