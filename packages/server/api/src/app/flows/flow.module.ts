import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { flowController } from './flow/flow.controller'
import { folderController } from './folder/folder.controller'
import { flowVersionController } from './flow/flow-version.controller'
import { testTriggerController } from './test-trigger/test-trigger-controller'

export const flowModule: FastifyPluginAsyncTypebox = async (app) => {
    await app.register(flowVersionController, { prefix: '/v1/flows' })
    await app.register(flowController, { prefix: '/v1/flows' })
    await app.register(folderController, { prefix: '/v1/folders' })
    await app.register(testTriggerController, { prefix: '/v1/test-trigger' })
}
