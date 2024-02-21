import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { PrincipalType } from '@activepieces/shared'
import { activityService } from './activity-service'
import { AddActivityRequestBody } from '@activepieces/ee-shared'
import { StatusCodes } from 'http-status-codes'

export const activityWorkerController: FastifyPluginAsyncTypebox = async (app) => {
    app.post('/', AddActivityRequest, async (req, res) => {
        const newActivity = await activityService.add(req.body)

        return res
            .status(StatusCodes.CREATED)
            .send(newActivity)
    })
}

const AddActivityRequest = {
    config: {
        allowedPrincipals: [
            PrincipalType.WORKER,
        ],
    },
    schema: {
        body: AddActivityRequestBody,
    },
}
