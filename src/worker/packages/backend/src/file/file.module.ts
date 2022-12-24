import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import {flowController} from "../flows/flow.controller";
import {fileController} from "./file.controller";
import {tokenVerifyMiddleware} from "../authentication/token-verify-middleware";

export const fileModule = async (app: FastifyInstance, _options: FastifyPluginOptions) => {
    app.register(fileController, { prefix: '/v1/files' });
};
