import { FastifyPluginCallbackTypebox } from '@fastify/type-provider-typebox'
import { AdminAddPlatformRequestBody } from '@activepieces/ee-shared'
import { platformService } from './platform.service'
import { StatusCodes } from 'http-status-codes'

export const adminPlatformController: FastifyPluginCallbackTypebox = (app, _opts, done) => {
    app.post('/', AdminAddPlatformRequest, async (req, res) => {
        const newPlatform = await platformService.add(req.body)
        return res
            .status(StatusCodes.CREATED)
            .send(newPlatform)
    })

    done()
}

const AdminAddPlatformRequest = {
    schema: {
        body: AdminAddPlatformRequestBody,
    },
}
