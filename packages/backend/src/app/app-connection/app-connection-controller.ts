import { FastifyInstance, FastifyPluginOptions, FastifyRequest } from "fastify";
import { StatusCodes } from "http-status-codes";
import { AppConnectionId, ListAppConnectionRequest, UpsertConnectionRequest } from "@activepieces/shared";
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
    "/:connectionId",
    async (
      request: FastifyRequest<{
        Params: {
          connectionId: AppConnectionId;
        };
      }>,
      _reply
    ) => {
      const appCredential = await appConnectionService.getOne(request.params.connectionId);
      if (appCredential === null) {
        throw new ActivepiecesError({
          code: ErrorCode.APP_CONNECTION_NOT_FOUND,
          params: { id: request.params.connectionId },
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
        query.name,
        query.cursor??null, query.limit?? DEFAULT_PAGE_SIZE);
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
