import { FastifyInstance, FastifyPluginOptions, FastifyRequest } from "fastify";
import { StatusCodes } from "http-status-codes";
import { AppConnectionId, ListAppConnectionRequest, UpsertConnectionRequest } from "shared";
import { appCredentialService } from "../app-credential/app-credential-service";
import { ActivepiecesError, ErrorCode } from "../helper/activepieces-error";
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
      let appCredential = await appCredentialService.getOneOrThrow(request.body.appCredentialId);
      return await appConnectionService.upsert(appCredential.projectId, request.body);
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
          code: ErrorCode.APP_SECRET_NOT_FOUND,
          params: { appCredentialId: request.params.connectionId },
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
