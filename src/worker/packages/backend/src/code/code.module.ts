import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import {codeController} from "./code.controller";

export const codeModule = async (app: FastifyInstance, _options: FastifyPluginOptions) => {
    app.register(codeController, { prefix: '/v1/codes' });
};
