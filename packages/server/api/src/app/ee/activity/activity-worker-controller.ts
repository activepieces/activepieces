import { FastifyPluginAsyncTypebox, Type } from '@fastify/type-provider-typebox'
import { StatusCodes } from 'http-status-codes'
import { activityService } from './activity-service'
import { AddActivityRequestBody, UpdateActivityRequestBody } from '@activepieces/ee-shared'
import { ApId, PrincipalType } from '@activepieces/shared'

export const activityWorkerController: FastifyPluginAsyncTypebox = async (app) => {
    app.post('/', AddActivityRequest, async (req, res) => {
        const newActivity = await activityService.add(req.body)

        return res
            .status(StatusCodes.CREATED)
            .send(newActivity)
    })

    app.post('/:id', UpdateActivityRequest, async (req, res) => {
        await activityService.update({
            id: req.params.id,
            ...req.body,
        })

        return res.status(StatusCodes.NO_CONTENT).send()
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

const UpdateActivityRequest = {
    config: {
        allowedPrincipals: [
            PrincipalType.WORKER,
        ],
    },
    schema: {
        params: Type.Object({
            id: ApId,
        }),
        body: UpdateActivityRequestBody,
    },
}
