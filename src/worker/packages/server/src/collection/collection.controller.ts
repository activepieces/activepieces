import {FastifyInstance, FastifyPluginOptions, FastifyRequest} from "fastify"
import {collectionService} from "./collection.service";
import {
    CreateCollectionSchema,
    CreateCollectionRequest,
    UpdateCollectionRequest,
    UpdateCollectionSchema,
    ListCollectionsSchema, CollectionVersionId
} from "shared";
import {CollectionId} from "shared";
import {StatusCodes} from "http-status-codes";
import {ProjectId} from "shared/dist/model/project";
import {ActivepiecesError, ErrorCode} from "../helper/activepieces-error";

export const collectionController = async (fastify: FastifyInstance, options: FastifyPluginOptions) => {

    fastify.delete('/:collectionId', async (_request: FastifyRequest<
        {
            Params: {
                collectionId: CollectionId
            }
        }>, _reply) => {
        await collectionService.delete(_request.params.collectionId);
        _reply.status(StatusCodes.OK).send();
    })

    fastify.get('/:collectionId', async (_request: FastifyRequest<
        {
            Params: {
                collectionId: CollectionId
            },
            Querystring: {
                versionId: CollectionVersionId | undefined
            }
        }>, _reply) => {
        const versionId: CollectionVersionId = _request.query.versionId;
        let collection = await collectionService.getOne(_request.params.collectionId, versionId);
        if(collection === null){
            throw new ActivepiecesError({ code: ErrorCode.COLLECTION_NOT_FOUND, params: {id: _request.params.collectionId}});
        }
        return collection;
    })

    fastify.post('/:collectionId', {
        schema: UpdateCollectionSchema
    }, async (_request: FastifyRequest<
        {
            Params: {
              collectionId: CollectionId
            },
            Body: UpdateCollectionRequest
        }>, _reply) => {
        let collection = await collectionService.getOne(_request.params.collectionId, undefined);
        if(collection === null){
            throw new ActivepiecesError({ code: ErrorCode.COLLECTION_NOT_FOUND, params: {id: _request.params.collectionId}});
        }
        return await collectionService.update(_request.params.collectionId, _request.body);
    })

    fastify.get('/', {
        schema: ListCollectionsSchema
    }, async (_request: FastifyRequest<
        {
            Querystring: {
                projectId: ProjectId
                limit: number;
                cursor: string;
            }
        }>, _reply) => {
         return await collectionService.list(_request.query.projectId, _request.query.cursor, _request.query.limit);
    })

    fastify.post('/', {
        schema: CreateCollectionSchema
    }, async (_request: FastifyRequest<
        {
            Body: CreateCollectionRequest
        }>, _reply) => {
        return await collectionService.create(_request.body);
    })
};

