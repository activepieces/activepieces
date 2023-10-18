import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { flowController } from './flow/flow.controller'
import { stepRunController } from './step-run/step-run-controller'
import { folderController } from './folder/folder.controller'
import { entitiesMustBeOwnedByCurrentProject } from '../authentication/authorization'

export const flowModule: FastifyPluginAsyncTypebox = async (app) => {
    await app.register(stepRunController, { prefix: '/v1/step-run' })
    app.addHook('preSerialization', entitiesMustBeOwnedByCurrentProject)
    await app.register(flowController, { prefix: '/v1/flows' })
    await app.register(folderController, { prefix: '/v1/folders' })
}
