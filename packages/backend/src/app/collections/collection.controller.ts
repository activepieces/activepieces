import { FastifyInstance, FastifyPluginOptions, FastifyRequest } from "fastify";
import { collectionService } from "./collection.service";
import {
  CollectionId,
  CollectionVersionId,
  CreateCollectionRequest,
  ListCollectionsRequest,
  UpdateCollectionRequest
} from "@activepieces/shared";
import { StatusCodes } from "http-status-codes";
import { ActivepiecesError, ErrorCode } from "@activepieces/shared";

const DEFAULT_PAGE_SIZE = 10;

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
      schema: {
        body: UpdateCollectionRequest
      },
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
      schema: {
        querystring: ListCollectionsRequest
      },
    },
    async (
      _request: FastifyRequest<{
        Querystring: ListCollectionsRequest;
      }>,
      _reply
    ) => {
      return await collectionService.list(_request.query.projectId, _request.query.cursor, _request.query.limit??DEFAULT_PAGE_SIZE);
    }
  );

  fastify.post(
    "/",
    {
      schema: {
        body: CreateCollectionRequest
      },
    },
    async (
      _request: FastifyRequest<{
        Body: CreateCollectionRequest;
      }>,
      _reply
    ) => {
      return await collectionService.create(_request.body);
    }
  );
};
