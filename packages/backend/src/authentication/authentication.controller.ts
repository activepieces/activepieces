import { FastifyInstance, FastifyPluginOptions, FastifyReply, FastifyRequest } from "fastify";
import { SignInRequest, SignUpRequest } from "shared";
import { authenticationService } from "./authentication.service";

export const authenticationController = async (app: FastifyInstance, _options: FastifyPluginOptions) => {
  app.post(
    "/sign-up",
    {
      schema: {
        body: SignUpRequest,
      },
    },
    async (request: FastifyRequest<{ Body: SignUpRequest }>, reply: FastifyReply) => {
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
};
