import { securityAccess } from '@activepieces/server-shared'
import { PrincipalType } from '@activepieces/shared'
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { StatusCodes } from 'http-status-codes'
import {
    CreateScimUserRequest,
    ReplaceScimUserRequest,
    ScimListQueryParams,
    ScimPatchRequest,
    ScimResourceId,
} from '@activepieces/ee-shared'
import { scimUserService } from './scim-user-service'

export const scimUserController: FastifyPluginAsyncTypebox = async (app) => {
    // GET /scim/v2/Users - List users
    app.get('/', ListUsersRequest, async (request, reply) => {
        console.error("list users", request.body)
        const platformId = request.principal.platform.id
        const result = await scimUserService(request.log).list({
            platformId,
            filter: request.query.filter,
            startIndex: request.query.startIndex,
            count: request.query.count,
        })
        return reply.status(StatusCodes.OK).send(result)
    })

    // GET /scim/v2/Users/:id - Get user by ID
    app.get('/:id', GetUserRequest, async (request, reply) => {
        console.error("get user", request.body)
        const platformId = request.principal.platform.id
        const result = await scimUserService(request.log).getById({
            platformId,
            userId: request.params.id,
        })
        return reply.status(StatusCodes.OK).send(result)
    })

    // POST /scim/v2/Users - Create user
    app.post('/', CreateUserRequest, async (request, reply) => {
        console.error("create user", request.body)
        const platformId = request.principal.platform.id
        const result = await scimUserService(request.log).create({
            platformId,
            request: request.body,
        })
        return reply.status(StatusCodes.CREATED).send(result)
    })

    // PUT /scim/v2/Users/:id - Replace user
    app.put('/:id', ReplaceUserRequest, async (request, reply) => {
        console.error("replace user", request.body)
        const platformId = request.principal.platform.id
        const result = await scimUserService(request.log).replace({
            platformId,
            userId: request.params.id,
            request: request.body,
        })
        return reply.status(StatusCodes.OK).send(result)
    })

    // PATCH /scim/v2/Users/:id - Update user
    app.patch('/:id', PatchUserRequest, async (request, reply) => {
        console.error("patch user", request.body)
        const platformId = request.principal.platform.id
        const result = await scimUserService(request.log).patch({
            platformId,
            userId: request.params.id,
            request: request.body,
        })
        return reply.status(StatusCodes.OK).send(result)
    })

    // DELETE /scim/v2/Users/:id - Deactivate user
    app.delete('/:id', DeleteUserRequest, async (request, reply) => {
        console.error("delete user", request.body)
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
