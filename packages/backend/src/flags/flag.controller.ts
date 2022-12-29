import { FastifyInstance, FastifyPluginOptions, FastifyReply, FastifyRequest } from "fastify";
import { AuthenticationRequest } from "shared";
import { flagService } from "./flag.service";

export const flagController = async (app: FastifyInstance, _options: FastifyPluginOptions) => {
  app.get("/", async (request: FastifyRequest<{ Body: AuthenticationRequest }>, reply: FastifyReply) => {
    const flags = await flagService.getAll();
    const flagMap: Record<string, unknown> = {};
    flags.forEach(flag => {
      flagMap[flag.id as string] = flag.value;
    });
    reply.send(flagMap);
  });
};
