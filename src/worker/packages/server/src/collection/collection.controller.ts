import {FastifyInstance, FastifyPluginOptions, FastifyRequest} from "fastify"
import {collectionService} from "./collection.service";
import KSUID from "ksuid";
import {CreateCollectionSchema, CreateCollectionRequest, UpdateCollectionRequest, UpdateCollectionSchema} from "shared";
import {CollectionId} from "shared/dist/model/collection";


export const collectionController = async (fastify: FastifyInstance, options: FastifyPluginOptions) => {

    fastify.get('/collections/:collectionId', async (_request: FastifyRequest<
        {
            Params: {
                collectionId: KSUID
            }
        }>, _reply) => {
        return {
            hello: _request.params.collectionId
        };
    })

    fastify.post('/collections/:collectionId', {
        schema: UpdateCollectionSchema
    }, async (_request: FastifyRequest<
        {
            Params: {
              collectionId: CollectionId
            },
            Body: UpdateCollectionRequest
        }>, _reply) => {
        return await collectionService.update(_request.params.collectionId, _request.body);
    })

    fastify.post('/collections', {
        schema: CreateCollectionSchema
    }, async (_request: FastifyRequest<
        {
            Body: CreateCollectionRequest
        }>, _reply) => {
        return await collectionService.create(_request.body);
    })
};

