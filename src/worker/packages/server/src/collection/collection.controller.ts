import {FastifyInstance, FastifyPluginOptions, FastifyRequest} from "fastify"
import {collectionService} from "./collection.service";
import {
    CreateCollectionSchema,
    CreateCollectionRequest,
    UpdateCollectionRequest,
    UpdateCollectionSchema,
    ListCollectionsSchema
} from "shared";
import {CollectionId} from "shared";
import {StatusCodes} from "http-status-codes";
import {ProjectId} from "shared/dist/model/project";

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
            }
        }>, _reply) => {
        return collectionService.getOne(_request.params.collectionId);
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
        try {
            return await collectionService.update(_request.params.collectionId, _request.body);
        }catch (e){
            console.error(e);
        }
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
        try{
         return await collectionService.list(_request.query.projectId, _request.query.cursor, _request.query.limit);
        }catch (e){
            console.error(e);
        }
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

