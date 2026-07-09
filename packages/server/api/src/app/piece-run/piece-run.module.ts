import { FastifyPluginAsync } from 'fastify'
import { entitiesMustBeOwnedByCurrentProject } from '../authentication/authorization'
import { pieceRunController } from './piece-run.controller'

export const pieceRunModule: FastifyPluginAsync = async (app) => {
    app.addHook('preSerialization', entitiesMustBeOwnedByCurrentProject)
    await app.register(pieceRunController, { prefix: '/v1/piece-runs' })
}
