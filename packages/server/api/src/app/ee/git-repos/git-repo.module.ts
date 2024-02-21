import { FastifyPluginAsync } from 'fastify'
import { gitRepoController } from './git-repo.controller'

export const gitRepoModule: FastifyPluginAsync = async (app) => {
    await app.register(gitRepoController, { prefix: '/v1/git-repos' })
}
