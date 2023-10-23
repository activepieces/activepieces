import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { AdminAddPlatformRequestBody } from '@activepieces/ee-shared'
import { platformService } from './platform.service'
import { StatusCodes } from 'http-status-codes'

export const adminPlatformController: FastifyPluginAsyncTypebox = async (app) => {
    app.post('/', AdminAddPlatformRequest, async (req, res) => {
        const newPlatform = await platformService.add(req.body)
        return res
            .status(StatusCodes.CREATED)
            .send(newPlatform)
    })
}

const AdminAddPlatformRequest = {
    schema: {
        body: AdminAddPlatformRequestBody,
    },
}
