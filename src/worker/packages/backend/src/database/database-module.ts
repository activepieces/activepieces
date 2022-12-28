import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { databaseConnection } from './database-connection';

export const databaseModule = async (_app: FastifyInstance, _options: FastifyPluginOptions) => {
    await databaseConnection.initialize();
};
