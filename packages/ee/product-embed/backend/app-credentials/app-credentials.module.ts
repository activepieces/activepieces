import { FastifyInstance, FastifyPluginOptions, FastifyRequest } from "fastify";
import { StatusCodes } from "http-status-codes";
import { SeekPage } from "@activepieces/shared";
import { appCredentialService } from "./app-credentials.service";
import { ListAppCredentialsRequest, UpsertAppCredentialRequest,  AppCredential, AppCredentialId, AppCredentialType} from "@activepieces/ee/shared";

export const appCredentialModule = async (app: FastifyInstance, _options: FastifyPluginOptions) => {
  app.register(appCredentialController, { prefix: "/v1/app-credentials" });
};

const DEFAULT_LIMIT_SIZE = 10;

const appCredentialController = async (fastify: FastifyInstance, options: FastifyPluginOptions) => {
  
  fastify.get("/", {
    schema: {
      querystring: ListAppCredentialsRequest
    }
  }, async (request: FastifyRequest<
    {
      Querystring: ListAppCredentialsRequest
    }>, _reply) => {
    const page = await appCredentialService.list(request.query.projectId, request.query.appName, request.query.cursor ?? null, request.query.limit ?? DEFAULT_LIMIT_SIZE);
    return censorClientSecret(page);
  });

  fastify.post(
    "/",
    {
      schema: {
        body: UpsertAppCredentialRequest
      },
    },
    async (
      request: FastifyRequest<{
        Body: UpsertAppCredentialRequest;
      }>,
      _reply
    ) => {
      return await appCredentialService.upsert({
        projectId: request.principal.projectId,
        request: request.body
      });
    }
  );

  fastify.delete(
    "/:credentialId",
    async (
      request: FastifyRequest<{
        Params: {
          credentialId: AppCredentialId;
        };
      }>,
      _reply
    ) => {
      await appCredentialService.delete(request.params.credentialId);
      _reply.status(StatusCodes.OK).send();
    }
  );

};

function censorClientSecret(page: SeekPage<AppCredential>): SeekPage<AppCredential> {
  page.data = page.data.map(f => {
    if (f.settings.type === AppCredentialType.OAUTH2) {
      f.settings.clientSecret = undefined;
    }
    return f;
  });
  return page;
}