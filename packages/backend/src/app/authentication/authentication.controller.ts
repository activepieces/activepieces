import { FastifyInstance, FastifyPluginOptions, FastifyReply, FastifyRequest } from "fastify";
import { SignInRequest, SignUpRequest } from "@activepieces/shared";
import { authenticationService } from "./authentication.service";
import { FlagIds, flagService } from "../flags/flag.service";
import { system } from "../helper/system/system";
import { SystemProp } from "../helper/system/system-prop";

export const authenticationController = async (app: FastifyInstance, _options: FastifyPluginOptions) => {
  app.post(
    "/sign-up",
    {
      schema: {
        body: SignUpRequest,
      },
    },
    async (request: FastifyRequest<{ Body: SignUpRequest }>, reply: FastifyReply) => {
      const userCreated = await flagService.getOne(FlagIds.USER_CREATED);
      const signUpEnabled = (await system.getBoolean(SystemProp.SIGN_UP_ENABLED)) ?? false;
      if (userCreated && !signUpEnabled) {
        reply.code(403).send({
          message: "Sign up is disabled"
        });
        return;
      }
      const authenticationResponse = await authenticationService.signUp(request.body);
      reply.send(authenticationResponse);
    }
  );

  app.post(
    "/sign-in",
    {
      schema: {
        body: SignInRequest,
      },
    },
    async (request: FastifyRequest<{ Body: SignInRequest }>, reply: FastifyReply) => {
      const authenticationResponse = await authenticationService.signIn(request.body);
      reply.send(authenticationResponse);
    }
  );

  app.get(
    "/me",
    async (request: FastifyRequest, reply: FastifyReply) => {
      reply.send(request.principal);
    }
  );
};
