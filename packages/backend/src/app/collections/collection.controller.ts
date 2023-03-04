import { FastifyInstance, FastifyRequest } from "fastify";
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

export const collectionController = async (fastify: FastifyInstance) => {
    fastify.delete(
        "/:collectionId",
        async (
            request: FastifyRequest<{
        Params: {
          collectionId: CollectionId;
        };
      }>,
            _reply
        ) => {
            await collectionService.delete({ projectId: request.principal.projectId, collectionId: request.params.collectionId });
            _reply.status(StatusCodes.OK).send();
        }
    );

    fastify.get(
        "/:collectionId",
        async (
            request: FastifyRequest<{
        Params: {
          collectionId: CollectionId;
        };
        Querystring: {
          versionId: CollectionVersionId | undefined;
        };
      }>
        ) => {
            const versionId: CollectionVersionId | undefined = request.query.versionId;
            const collection = await collectionService.getOne({ id: request.params.collectionId, versionId: versionId ?? null, projectId: request.principal.projectId });
            if (collection === null) {
                throw new ActivepiecesError({
                    code: ErrorCode.COLLECTION_NOT_FOUND,
                    params: { id: request.params.collectionId },
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
            request: FastifyRequest<{
        Params: {
          collectionId: CollectionId;
        };
        Body: UpdateCollectionRequest;
      }>
        ) => {
            const collection = await collectionService.getOne({ id: request.params.collectionId, versionId: null, projectId: request.principal.projectId });
            if (collection === null) {
                throw new ActivepiecesError({
                    code: ErrorCode.COLLECTION_NOT_FOUND,
                    params: { id: request.params.collectionId },
                });
            }
            return await collectionService.update({ projectId: request.principal.projectId, collectionId: request.params.collectionId, request: request.body });
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
            request: FastifyRequest<{
        Querystring: ListCollectionsRequest;
      }>
        ) => {
            return await collectionService.list(request.query.projectId, request.query.cursor, request.query.limit ?? DEFAULT_PAGE_SIZE);
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
            request: FastifyRequest<{
        Body: CreateCollectionRequest;
      }>
        ) => {
            return await collectionService.create({ projectId: request.principal.projectId, request: request.body });
        }
    );
};
