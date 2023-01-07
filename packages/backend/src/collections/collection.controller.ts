import { FastifyInstance, FastifyPluginOptions, FastifyRequest } from "fastify";
import { collectionService } from "./collection.service";
import {
  CollectionId,
  CollectionVersionId,
  CreateCollectionRequest,
  CreateCollectionSchema,
  ListCollectionsSchema,
  ProjectId,
  UpdateCollectionRequest,
  UpdateCollectionSchema,
} from "shared";
import { StatusCodes } from "http-status-codes";
import { ActivepiecesError, ErrorCode } from "../helper/activepieces-error";

export const collectionController = async (fastify: FastifyInstance, options: FastifyPluginOptions) => {
  fastify.delete(
    "/:collectionId",
    async (
      _request: FastifyRequest<{
        Params: {
          collectionId: CollectionId;
        };
      }>,
      _reply
    ) => {
      await collectionService.delete(_request.params.collectionId);
      _reply.status(StatusCodes.OK).send();
    }
  );

  fastify.get(
    "/:collectionId",
    async (
      _request: FastifyRequest<{
        Params: {
          collectionId: CollectionId;
        };
        Querystring: {
          versionId: CollectionVersionId | undefined;
        };
      }>,
      _reply
    ) => {
      const versionId: CollectionVersionId | undefined = _request.query.versionId;
      const collection = await collectionService.getOne(_request.params.collectionId, versionId ?? null);
      if (collection === null) {
        throw new ActivepiecesError({
          code: ErrorCode.COLLECTION_NOT_FOUND,
          params: { id: _request.params.collectionId },
        });
      }
      return collection;
    }
  );

  fastify.post(
    "/:collectionId",
    {
      schema: UpdateCollectionSchema,
    },
    async (
      _request: FastifyRequest<{
        Params: {
          collectionId: CollectionId;
        };
        Body: UpdateCollectionRequest;
      }>,
      _reply
    ) => {
      const collection = await collectionService.getOne(_request.params.collectionId, null);
      if (collection === null) {
        throw new ActivepiecesError({
          code: ErrorCode.COLLECTION_NOT_FOUND,
          params: { id: _request.params.collectionId },
        });
      }
      return await collectionService.update(_request.params.collectionId, _request.body);
    }
  );

  fastify.get(
    "/",
    {
      schema: ListCollectionsSchema,
    },
    async (
      _request: FastifyRequest<{
        Querystring: {
          projectId: ProjectId;
          limit: number;
          cursor: string;
        };
      }>,
      _reply
    ) => {
      return await collectionService.list(_request.query.projectId, _request.query.cursor, _request.query.limit);
    }
  );

  fastify.post(
    "/",
    {
      schema: CreateCollectionSchema,
    },
    async (
      request: FastifyRequest<{
        Body: CreateCollectionRequest;
      }>,
      _reply
    ) => {
      return await collectionService.create(request.body);;
    }
  );
};
