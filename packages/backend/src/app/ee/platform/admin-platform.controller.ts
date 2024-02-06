import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { AdminAddPlatformRequestBody } from '@activepieces/shared'
import { StatusCodes } from 'http-status-codes'
import { adminPlatformService } from './admin-platform.service'
import { PrincipalType } from '@activepieces/shared'

export const adminPlatformController: FastifyPluginAsyncTypebox = async (app) => {
    app.post('/', AdminAddPlatformRequest, async (req, res) => {
        const newPlatform = await adminPlatformService.add(req.body)

        return res
            .status(StatusCodes.CREATED)
            .send(newPlatform)
    })
}

const AdminAddPlatformRequest = {
    schema: {
        body: AdminAddPlatformRequestBody,
    },
    config: {
        allowedPrincipals: [PrincipalType.SUPER_USER],
    },
}
