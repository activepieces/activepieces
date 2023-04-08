import { FastifyInstance, FastifyPluginOptions, FastifyRequest } from "fastify";
import { ConnectionKeyId, GetOrDeleteConnectionFromTokenRequest, ListConnectionKeysRequest, UpsertConnectionFromToken, UpsertSigningKeyConnection} from "@activepieces/ee/shared";
import { appConnectionService } from "@backend/app-connection/app-connection.service";
import { connectionKeyService } from "./connection-key.service";
import { StatusCodes } from "http-status-codes";

export const connectionKeyModule = async (app: FastifyInstance, _options: FastifyPluginOptions) => {
  app.register(connectionKeyController, { prefix: "/v1/connection-keys" });
};

const DEFAULT_LIMIT_SIZE = 10;

const connectionKeyController = async (fastify: FastifyInstance, options: FastifyPluginOptions) => {


  fastify.delete(
    "/app-connections",
    {
      schema: {
        querystring: GetOrDeleteConnectionFromTokenRequest
      },
    },
    async (
      request: FastifyRequest<{
        Querystring: GetOrDeleteConnectionFromTokenRequest;
      }>,
      _reply
    ) => {
      let appConnection = await connectionKeyService.getConnection(request.query);
      if(appConnection !== null){
        await appConnectionService.delete({projectId: request.principal.projectId, id: appConnection.id});
      }
    }
  );

  fastify.get(
    "/app-connections",
    {
      schema: {
        querystring: GetOrDeleteConnectionFromTokenRequest
      },
    },
    async (
      request: FastifyRequest<{
        Querystring: GetOrDeleteConnectionFromTokenRequest;
      }>,
      _reply
    ) => {
      return await connectionKeyService.getConnection(request.query);
    }
  );


  fastify.post(
    "/app-connections",
    {
      schema: {
        body: UpsertConnectionFromToken
      },
    },
    async (
      request: FastifyRequest<{
        Body: UpsertConnectionFromToken;
      }>,
      _reply
    ) => {
      return await connectionKeyService.createConnection(request.body);
    }
  );

  fastify.get("/", {
    schema: {
      querystring: ListConnectionKeysRequest
    }
  }, async (request: FastifyRequest<
    {
      Querystring: ListConnectionKeysRequest
    }>, _reply) => {
    return await connectionKeyService.list(request.principal.projectId, request.query.cursor ?? null, request.query.limit ?? DEFAULT_LIMIT_SIZE);
  });


  fastify.post(
    "/",
    {
      schema: {
        body: UpsertSigningKeyConnection
      },
    },
    async (
      request: FastifyRequest<{
        Body: UpsertSigningKeyConnection;
      }>,
      _reply
    ) => {
      return await connectionKeyService.upsert({
        projectId: request.principal.projectId,
        request: request.body
      });
    }
  );


  fastify.delete(
    "/:connectionkeyId",
    async (
      request: FastifyRequest<{
        Params: {
          connectionkeyId: ConnectionKeyId;
        };
      }>,
      _reply
    ) => {
      await connectionKeyService.delete(request.params.connectionkeyId);
      _reply.status(StatusCodes.OK).send();
    }
  );
};