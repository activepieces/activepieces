import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import {collectionController} from "./collection.controller";

export const collectionModule = async (app: FastifyInstance, _options: FastifyPluginOptions) => {
    app.register(collectionController, { prefix: '/v1/collection' });
};
