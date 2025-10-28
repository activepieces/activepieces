import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { changelogController } from './changelog.controller'

export const changelogModule: FastifyPluginAsyncTypebox = async (fastify) => {
    await fastify.register(changelogController, { prefix: '/v1/changelogs' })
}
