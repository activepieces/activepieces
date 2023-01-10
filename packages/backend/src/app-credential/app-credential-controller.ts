import { FastifyInstance, FastifyPluginOptions, FastifyRequest } from "fastify";
import {
  AppCredentialId,
  ListAppRequest, UpsertAppCredentialsRequest,
} from "shared";
import { StatusCodes } from "http-status-codes";
import { ActivepiecesError, ErrorCode } from "../helper/activepieces-error";
import { appCredentialService } from "./app-credential-service";


export const appCredentialController = async (fastify: FastifyInstance, options: FastifyPluginOptions) => {
  fastify.post(
    "/",
    {
      schema: UpsertAppCredentialsRequest,
    },
    async (
      request: FastifyRequest<{
        Body: UpsertAppCredentialsRequest;
      }>,
      _reply
    ) => {
      return await appCredentialService.upsert(request.body);
    }
  );


  fastify.get(
    "/:id",
    async (
      request: FastifyRequest<{
        Params: {
          id: AppCredentialId;
        };
      }>,
      _reply
    ) => {
      const appCredential = await appCredentialService.getOne(request.params.id);
      if (appCredential === null) {
        throw new ActivepiecesError({
          code: ErrorCode.APP_SECRET_NOT_FOUND,
          params: { appCredentialId: request.params.id },
        });
      }
      return appCredential;
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
      return await appCredentialService.list(request.query.projectId, request.query.cursor, request.query.limit);
    }
  );

  fastify.delete(
    "/:id",
    async (
      request: FastifyRequest<{
        Params: {
          id: AppCredentialId;
        };
      }>,
      _reply
    ) => {
      await appCredentialService.delete(request.params.id);
      _reply.status(StatusCodes.OK).send();
    }
  );
};
