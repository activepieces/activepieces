import { FastifyInstance, FastifyRequest } from "fastify";
import { collectionService } from "./collection.service";
import {
    CollectionId,
    CreateCollectionRequest,
    ListCollectionsRequest,
    UpdateCollectionRequest
} from "@activepieces/shared";
import { StatusCodes } from "http-status-codes";
import { ActivepiecesError, ErrorCode } from "@activepieces/shared";
import { Static, Type } from "@sinclair/typebox";

const DEFAULT_PAGE_SIZE = 10;

const CollectionIdParams = Type.Object({
    collectionId: Type.String(),
});
type CollectionIdParams = Static<typeof CollectionIdParams>;


export const collectionController = async (fastify: FastifyInstance) => {
    fastify.delete(
        "/:collectionId",
        {
            schema: {
                description: "Delete a collection",
                tags: ["collection"],
                summary: "Delete a collection",
                params: CollectionIdParams,
            }
        },
        async (
            request: FastifyRequest<{
                Params: CollectionIdParams;
            }>,
            reply
        ) => {
            await collectionService.delete({ projectId: request.principal.projectId, collectionId: request.params.collectionId });
            reply.status(StatusCodes.OK).send();
        }
    );

    fastify.get(
        "/:collectionId",
        async (
            request: FastifyRequest<{
                Params: {
                    collectionId: CollectionId;
                };
            }>
        ) => {
            const collection = await collectionService.getOne({ id: request.params.collectionId, projectId: request.principal.projectId });
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
            const collection = await collectionService.getOne({ id: request.params.collectionId,projectId: request.principal.projectId });
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
                description: "List Collections",
                tags: ["collection"],
                summary: "List Collections",
                querystring: ListCollectionsRequest,
            },
        },
        async (
            request: FastifyRequest<{
                Querystring: ListCollectionsRequest;
            }>
        ) => {
            return await collectionService.list(request.principal.projectId, request.query.cursor, request.query.limit ?? DEFAULT_PAGE_SIZE);
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
