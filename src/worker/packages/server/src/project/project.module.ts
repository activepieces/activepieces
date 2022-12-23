import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import {projectController} from "./project.controller";
import {tokenVerifyMiddleware} from "../authentication/token-verify-middleware";

export const projectModule = async (app: FastifyInstance, _options: FastifyPluginOptions) => {
    app.addHook('onRequest', tokenVerifyMiddleware);
    app.register(projectController, { prefix: '/v1/projects' });
};
