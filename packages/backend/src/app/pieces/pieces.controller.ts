import { FastifyInstance, FastifyPluginOptions, FastifyRequest } from "fastify";
import { PieceOptionRequest } from "shared";
import { pieces } from "pieces";
import { collectionVersionService } from "../collections/collection-version/collection-version.service";
import { collectionService } from "../collections/collection.service";
import { engineHelper } from "../helper/engine-helper";

export const piecesController = async (fastify: FastifyInstance, options: FastifyPluginOptions) => {
  fastify.get("/v1/pieces", async (_request, _reply) => {
    return pieces.map((f) => f.metadata());
  });

  fastify.post(
    "/v1/pieces/:pieceName/options",
    {
      schema: {
        body: PieceOptionRequest
      },
    },
    async (
      request: FastifyRequest<{
        Params: { pieceName: string };
        Body: PieceOptionRequest;
      }>,
      _reply
    ) => {
      let collectionVersion = await collectionVersionService.getOneOrThrow(request.body.collectionVersionId);
      let collection = await collectionService.getOneOrThrow(collectionVersion.collectionId);
      return engineHelper.dropdownOptions({
        pieceName: request.params.pieceName,
        propertyName: request.body.propertyName,
        stepName: request.body.stepName,
        input: request.body.input,
        collectionVersion: collectionVersion,
        projectId: collection.projectId
      })
    }
  );
};
