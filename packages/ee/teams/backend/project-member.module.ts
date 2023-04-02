import { FastifyInstance, FastifyPluginOptions, FastifyRequest } from "fastify";
import { StatusCodes } from "http-status-codes";
import { projectMemberService } from "./project-member.service";
import { SendInvitationRequest, ListProjectMembersRequest } from "../shared/project-member-request";

export const projectMemberModule = async (app: FastifyInstance, _options: FastifyPluginOptions) => {
  app.register(projectMemberController, { prefix: "/v1/project-members" });
}

const DEFAULT_LIMIT_SIZE = 10;

const projectMemberController = async (fastify: FastifyInstance, options: FastifyPluginOptions) => {

  fastify.get("/", {
    schema: {
      querystring: ListProjectMembersRequest
    }
  }, async (request: FastifyRequest<
    {
      Querystring: ListProjectMembersRequest
    }>, _reply) => {
    return await projectMemberService.list(request.principal.projectId, request.query.cursor ?? null, request.query.limit ?? DEFAULT_LIMIT_SIZE);
  });

  fastify.post(
    "/invite",
    {
      schema: {
        body: SendInvitationRequest
      },
    },
    async (
      request: FastifyRequest<{
        Body: SendInvitationRequest;
      }>,
      _reply
    ) => {
      return await projectMemberService.send(request.principal.projectId, request.body);
    }
  );

  fastify.delete(
    "/:invitationId",
    async (
      request: FastifyRequest<{
        Params: {
          invitationId: string;
        };
      }>,
      _reply
    ) => {
      await projectMemberService.delete(request.principal.projectId, request.params.invitationId);
      _reply.status(StatusCodes.OK).send();
    }
  );

}