import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import {fileController} from "./file.controller";

export const fileModule = async (app: FastifyInstance, _options: FastifyPluginOptions) => {
    app.register(fileController, { prefix: '/v1/files' });
};
