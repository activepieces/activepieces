import {
    CreateScimUserRequest,
    ReplaceScimUserRequest,
    ScimListQueryParams,
    ScimPatchRequest,
    ScimResourceId,
} from '@activepieces/ee-shared'
import { securityAccess } from '@activepieces/server-shared'
import { PrincipalType } from '@activepieces/shared'
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { StatusCodes } from 'http-status-codes'
import { scimUserService } from './scim-user-service'

export const scimUserController: FastifyPluginAsyncTypebox = async (app) => {
    app.get('/', ListUsersRequest, async (request, reply) => {
        const platformId = request.principal.platform.id
        const result = await scimUserService(request.log).list({
            platformId,
            filter: request.query.filter,
            startIndex: request.query.startIndex,
            count: request.query.count,
        })
        return reply.status(StatusCodes.OK).send(result)
    })

    app.get('/:id', GetUserRequest, async (request, reply) => {
        const platformId = request.principal.platform.id
        const result = await scimUserService(request.log).getById({
            platformId,
            userId: request.params.id,
        })
        return reply.status(StatusCodes.OK).send(result)
    })

    app.post('/', CreateUserRequest, async (request, reply) => {
        const platformId = request.principal.platform.id
        const result = await scimUserService(request.log).create({
            platformId,
            request: request.body,
        })
        return reply.status(StatusCodes.CREATED).send(result)
    })

    app.put('/:id', ReplaceUserRequest, async (request, reply) => {
        const platformId = request.principal.platform.id
        const result = await scimUserService(request.log).replace({
            platformId,
            userId: request.params.id,
            request: request.body,
        })
        return reply.status(StatusCodes.OK).send(result)
    })

    app.patch('/:id', PatchUserRequest, async (request, reply) => {
        const platformId = request.principal.platform.id
        const result = await scimUserService(request.log).patch({
            platformId,
            userId: request.params.id,
            request: request.body,
        })
        return reply.status(StatusCodes.OK).send(result)
    })

    app.delete('/:id', DeleteUserRequest, async (request, reply) => {
        const platformId = request.principal.platform.id
        await scimUserService(request.log).deactivate({
            platformId,
            userId: request.params.id,
        })
        return reply.status(StatusCodes.NO_CONTENT).send()
    })
}

const scimSecurity = securityAccess.platformAdminOnly([PrincipalType.SERVICE])

const ListUsersRequest = {
    config: {
        security: scimSecurity,
    },
    schema: {
        querystring: ScimListQueryParams,
    },
}

const GetUserRequest = {
    config: {
        security: scimSecurity,
    },
    schema: {
        params: ScimResourceId,
    },
}

const CreateUserRequest = {
    config: {
        security: scimSecurity,
    },
    schema: {
        body: CreateScimUserRequest,
    },
}

const ReplaceUserRequest = {
    config: {
        security: scimSecurity,
    },
    schema: {
        params: ScimResourceId,
        body: ReplaceScimUserRequest,
    },
}

const PatchUserRequest = {
    config: {
        security: scimSecurity,
    },
    schema: {
        params: ScimResourceId,
        body: ScimPatchRequest,
    },
}

const DeleteUserRequest = {
    config: {
        security: scimSecurity,
    },
    schema: {
        params: ScimResourceId,
    },
}
