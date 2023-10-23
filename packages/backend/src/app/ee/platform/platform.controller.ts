import { FastifyPluginAsyncTypebox, Type } from '@fastify/type-provider-typebox'
import { UpdatePlatformRequestBody } from '@activepieces/ee-shared'
import { ApId } from '@activepieces/shared'
import { platformService } from './platform.service'

export const platformController: FastifyPluginAsyncTypebox = async (app) => {
    app.post('/:id', UpdatePlatformRequest, async (req) => {
        return await platformService.update({
            id: req.params.id,
            userId: req.principal.id,
            ...req.body,
        })
    })

    app.get('/:id', GetPlatformRequest, async (req) => {
        return await platformService.getOneOrThrow(req.params.id)
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
