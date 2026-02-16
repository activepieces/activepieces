import { securityAccess } from '@activepieces/server-shared'
import { PrincipalType } from '@activepieces/shared'
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { StatusCodes } from 'http-status-codes'
import {
    CreateScimGroupRequest,
    ReplaceScimGroupRequest,
    ScimListQueryParams,
    ScimPatchRequest,
    ScimResourceId,
} from '@activepieces/ee-shared'
import { scimGroupService } from './scim-group-service'

export const scimGroupController: FastifyPluginAsyncTypebox = async (app) => {

    // GET /scim/v2/Groups - List groups
    app.get('/', ListGroupsRequest, async (request, reply) => {
        console.error("list", request.body)
        const platformId = request.principal.platform.id
        const result = await scimGroupService(request.log).list({
            platformId,
            filter: request.query.filter,
            startIndex: request.query.startIndex,
            count: request.query.count,
        })
        return reply.status(StatusCodes.OK).send(result)
    })

    // GET /scim/v2/Groups/:id - Get group by ID
    app.get('/:id', GetGroupRequest, async (request, reply) => {
        console.error("get group", request.body)
        const platformId = request.principal.platform.id
        const result = await scimGroupService(request.log).getById({
            platformId,
            projectId: request.params.id,
        })
        return reply.status(StatusCodes.OK).send(result)
    })

    // POST /scim/v2/Groups - Create group
    app.post('/', CreateGroupRequest, async (request, reply) => {
        console.error("post gropu", request.body)
        const platformId = request.principal.platform.id
        const result = await scimGroupService(request.log).create({
            platformId,
            request: request.body,
        })
        return reply.status(StatusCodes.CREATED).send(result)
    })

    // PUT /scim/v2/Groups/:id - Replace group
    app.put('/:id', ReplaceGroupRequest, async (request, reply) => {
        console.error("put", request.body)
        const platformId = request.principal.platform.id
        const result = await scimGroupService(request.log).replace({
            platformId,
            projectId: request.params.id,
            request: request.body,
        })
        return reply.status(StatusCodes.OK).send(result)
    })

    // PATCH /scim/v2/Groups/:id - Update group
    app.patch('/:id', PatchGroupRequest, async (request, reply) => {
        console.error("patch", request.body)
        const platformId = request.principal.platform.id
        const result = await scimGroupService(request.log).patch({
            platformId,
            projectId: request.params.id,
            request: request.body,
        })
        return reply.status(StatusCodes.OK).send(result)
    })

    // DELETE /scim/v2/Groups/:id - Soft-delete group
    app.delete('/:id', DeleteGroupRequest, async (request, reply) => {
        console.error("get", request.body)
        const platformId = request.principal.platform.id
        await scimGroupService(request.log).softDelete({
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
