import { FastifyInstance, FastifyPluginOptions } from 'fastify';

import {storeEntryController} from "./store-entry.controller";

export const storeEntryModule = async (app: FastifyInstance, _options: FastifyPluginOptions) => {
    app.register(storeEntryController, { prefix: '/v1/store-entries' });
};
