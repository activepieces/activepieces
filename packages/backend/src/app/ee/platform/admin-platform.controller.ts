import { FastifyPluginCallbackTypebox } from '@fastify/type-provider-typebox'
import { AdminAddPlatformRequestBody } from '@activepieces/ee-shared'
import { platformService } from './platform.service'

export const adminPlatformController: FastifyPluginCallbackTypebox = (app, _opts, done) => {
    app.post('/', AdminAddPlatformRequest, async (req) => {
        return await platformService.add(req.body)
    })

    done()
}

const AdminAddPlatformRequest = {
    schema: {
        body: AdminAddPlatformRequestBody,
    },
}
