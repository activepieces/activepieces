import { FastifyPluginCallbackTypebox } from '@fastify/type-provider-typebox'
import { flowController } from './flow/flow.controller'
import { stepRunController } from './step-run/step-run-controller'
import { folderController } from './folder/folder.controller'

export const flowModule: FastifyPluginCallbackTypebox = (app, _opts, done) => {
    app.register(flowController, { prefix: '/v1/flows' })
    app.register(stepRunController, { prefix: '/v1/step-run' })
    app.register(folderController, { prefix: '/v1/folders' })
    done()
}
