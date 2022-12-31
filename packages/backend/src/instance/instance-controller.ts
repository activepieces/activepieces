import { FastifyInstance, FastifyPluginOptions, FastifyReply, FastifyRequest } from "fastify";
import { StatusCodes } from "http-status-codes";
import { CollectionId, Cursor, InstanceId, ProjectId, UpsertInstanceRequest } from "shared";
import { ActivepiecesError, ErrorCode } from "../helper/activepieces-error";
import { instanceService as service } from "./instance-service";

const DEFAULT_PAGING_LIMIT = 10;

interface GetOnePathParams {
  id: InstanceId;
}

export const instanceController = async (app: FastifyInstance, _options: FastifyPluginOptions) => {
  // upsert
  app.post(
    "/",
    {
      schema: {
        body: UpsertInstanceRequest,
      },
    },
    async (request: FastifyRequest<{ Body: UpsertInstanceRequest }>, reply: FastifyReply) => {
      const instance = await service.upsert(request.body);
      reply.send(instance);
    }
  );

  // list
  app.get(
    "/",
    async (
      request: FastifyRequest<{
        Querystring: {
          collectionId: CollectionId;
        };
      }>,
      reply: FastifyReply
    ) => {
      reply.send(await service.getByCollectionId({ collectionId: request.query.collectionId }));
    }
  );

  // delete one
  app.delete("/:id", async (request: FastifyRequest<{ Params: GetOnePathParams }>, reply: FastifyReply) => {
    const instance = await service.deleteOne({
      id: request.params.id,
    });

    reply.status(StatusCodes.OK).send();
  });
};
