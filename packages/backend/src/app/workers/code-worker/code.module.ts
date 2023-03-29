import { FastifyInstance } from 'fastify';
import { codeController } from './code.controller';

export const codeModule = async (app: FastifyInstance) => {
    app.register(codeController, { prefix: '/v1/codes' });
};
