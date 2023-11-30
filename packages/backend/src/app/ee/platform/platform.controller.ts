import { FastifyPluginAsyncTypebox, Type } from '@fastify/type-provider-typebox'
import { UpdatePlatformRequestBody } from '@activepieces/ee-shared'
import { ApId, assertEqual } from '@activepieces/shared'
import { platformService } from './platform.service'
import { platformMustBeOwnedByCurrentUser } from '../authentication/ee-authorization'

export const platformController: FastifyPluginAsyncTypebox = async (app) => {
    app.addHook('onRequest', platformMustBeOwnedByCurrentUser)

    app.post('/:id', UpdatePlatformRequest, async (req) => {
        return platformService.update({
            id: req.params.id,
            userId: req.principal.id,
            ...req.body,
        })
    })

    app.get('/:id', GetPlatformRequest, async (req) => {
        assertEqual(req.principal.platform?.id, req.params.id, 'userPlatformId', 'paramId')
        return platformService.getOneOrThrow(req.params.id)
    })
}

const UpdatePlatformRequest = {
    schema: {
        body: UpdatePlatformRequestBody,
        params: Type.Object({
            id: ApId,
        }),
    },
}

const GetPlatformRequest = {
    schema: {
        params: Type.Object({
            id: ApId,
        }),
    },
}
