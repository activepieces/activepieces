import { ApId, assertNotNullOrUndefined, CreateRbacRequestBody, Rbac, RoleType, UpdateRbacRequestBody } from '@activepieces/shared'
import { FastifyPluginAsyncTypebox, Type } from '@fastify/type-provider-typebox'
import { StatusCodes } from 'http-status-codes'
import { rbacService } from './rbac.service'

export const rbacController: FastifyPluginAsyncTypebox = async (app) => {

    app.get('/', {}, async (req) => {
        const platformId = req.principal.platform.id
        assertNotNullOrUndefined(platformId, 'platformId')

        return rbacService.list(platformId)
    })

    app.post('/get/:id', GetRbacRequest, async (req) => {
        return rbacService.get(req.params.id, req.body.type)
    })

    app.post('/', CreateRbacRequest, async (req, reply) => {
        const result = await rbacService.create(req.body)
        return reply.code(StatusCodes.CREATED).send(result)
    })

    app.post('/:id', UpdateRbacRequest, async (req) => {
        return rbacService.update(req.params.id, req.body)
    })

    app.delete('/:id', DeleteRbacRequest, async (req) => {
        return rbacService.delete(req.params.id)
    })
}

const GetRbacRequest = {
    schema: {
        params: Type.Object({
            id: ApId,
        }),
        body: Type.Object({
            type: Type.Optional(Type.Enum(RoleType)),
        }),
    },
}

const CreateRbacRequest = {
    schema: {
        body: CreateRbacRequestBody,
        response: {
            [StatusCodes.CREATED]: Rbac,
        },
    },
}

const UpdateRbacRequest = {
    schema: {
        body: UpdateRbacRequestBody,
        params: Type.Object({
            id: ApId,
        }),
        response: {
            [StatusCodes.OK]: Rbac,
        },
    },
}

const DeleteRbacRequest = {
    schema: {
        params: Type.Object({
            id: ApId,
        }),
        response: {
            [StatusCodes.NO_CONTENT]: Type.Null(),
        },
    },
}