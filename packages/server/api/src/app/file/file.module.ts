import { rejectedPromiseHandler } from '@activepieces/server-shared'
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { entitiesMustBeOwnedByCurrentProject } from '../authentication/authorization'
import { stepFileMigration } from './step-file/step-file-migration'
import { stepFileController } from './step-file/step-file.controller'

export const fileModule: FastifyPluginAsyncTypebox = async (app) => {
    rejectedPromiseHandler(stepFileMigration.migrate())
    app.addHook('preSerialization', entitiesMustBeOwnedByCurrentProject)
    await app.register(stepFileController, { prefix: '/v1/step-files' })
}
