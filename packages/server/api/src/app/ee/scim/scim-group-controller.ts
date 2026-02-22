import {
    CreateScimGroupRequest,
    ReplaceScimGroupRequest,
    ScimListQueryParams,
    ScimPatchRequest,
    ScimResourceId,
} from '@activepieces/ee-shared'
import { securityAccess } from '@activepieces/server-shared'
import { PrincipalType } from '@activepieces/shared'
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { StatusCodes } from 'http-status-codes'
import { scimGroupService } from './scim-group-service'

export const scimGroupController: FastifyPluginAsyncTypebox = async (app) => {

    app.get('/', ListGroupsRequest, async (request, reply) => {
        const platformId = request.principal.platform.id
        const result = await scimGroupService(request.log).list({
            platformId,
            filter: request.query.filter,
            startIndex: request.query.startIndex,
            count: request.query.count,
        })
        return reply.status(StatusCodes.OK).send(result)
    })

    app.get('/:id', GetGroupRequest, async (request, reply) => {
        const platformId = request.principal.platform.id
        const result = await scimGroupService(request.log).getById({
            platformId,
            projectId: request.params.id,
        })
        return reply.status(StatusCodes.OK).send(result)
    })

    app.post('/', CreateGroupRequest, async (request, reply) => {
        const platformId = request.principal.platform.id
        const result = await scimGroupService(request.log).create({
            platformId,
            request: request.body,
        })
        return reply.status(StatusCodes.CREATED).send(result)
    })

    app.put('/:id', ReplaceGroupRequest, async (request, reply) => {
        const platformId = request.principal.platform.id
        const result = await scimGroupService(request.log).replace({
            platformId,
            projectId: request.params.id,
            request: request.body,
        })
        return reply.status(StatusCodes.OK).send(result)
    })

    app.patch('/:id', PatchGroupRequest, async (request, reply) => {
        const platformId = request.principal.platform.id
        const result = await scimGroupService(request.log).patch({
            platformId,
            projectId: request.params.id,
            request: request.body,
        })
        return reply.status(StatusCodes.OK).send(result)
    })

    app.delete('/:id', DeleteGroupRequest, async (request, reply) => {
        const platformId = request.principal.platform.id
        await scimGroupService(request.log).delete({
            platformId,
            projectId: request.params.id,
        })
        return reply.status(StatusCodes.NO_CONTENT).send()
    })
}

const scimSecurity = securityAccess.platformAdminOnly([PrincipalType.SERVICE])

const ListGroupsRequest = {
    config: {
        security: scimSecurity,
    },
    schema: {
        querystring: ScimListQueryParams,
    },
}

const GetGroupRequest = {
    config: {
        security: scimSecurity,
    },
    schema: {
        params: ScimResourceId,
    },
}

const CreateGroupRequest = {
    config: {
        security: scimSecurity,
    },
    schema: {
        body: CreateScimGroupRequest,
    },
}

const ReplaceGroupRequest = {
    config: {
        security: scimSecurity,
    },
    schema: {
        params: ScimResourceId,
        body: ReplaceScimGroupRequest,
    },
}

const PatchGroupRequest = {
    config: {
        security: scimSecurity,
    },
    schema: {
        params: ScimResourceId,
        body: ScimPatchRequest,
    },
}

const DeleteGroupRequest = {
    config: {
        security: scimSecurity,
    },
    schema: {
        params: ScimResourceId,
    },
}
