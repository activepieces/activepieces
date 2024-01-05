import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { flowController } from './flow/flow.controller'
import { stepRunController } from './step-run/step-run-controller'
import { folderController } from './folder/folder.controller'
import { flowVersionController } from './flow/flow-version.controller'

export const flowModule: FastifyPluginAsyncTypebox = async (app) => {
    await app.register(stepRunController, { prefix: '/v1/step-run' })
    await app.register(flowVersionController, { prefix: '/v1/flows' })
    await app.register(flowController, { prefix: '/v1/flows' })
    await app.register(folderController, { prefix: '/v1/folders' })
}
