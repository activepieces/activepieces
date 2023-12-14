import { FastifyPluginAsyncTypebox, Type } from '@fastify/type-provider-typebox'
import { ApId } from '@activepieces/shared'
import { enterpriseUserService } from './enterprise-user-service'

export const enterpriseUserController: FastifyPluginAsyncTypebox = async (app) => {
    app.get('/', ListUsersRequest, async (req) => {
        return enterpriseUserService.list({
            platformId: req.query.platformId,
        })
    })

    app.delete('/:id', DeleteUserRequest, async (req) => {
        await enterpriseUserService.delete(req.params.id)
    })
}

const ListUsersRequest = {
    schema: {
        querystring: Type.Object({
            platformId: ApId,
        }),
    },
}

const DeleteUserRequest = {
    schema: {
        params: Type.Object({
            id: ApId,
        }),
    },
}
