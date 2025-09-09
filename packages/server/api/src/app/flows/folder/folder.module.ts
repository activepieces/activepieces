import {
    CreateFolderRequest,
    DeleteFolderRequest,
    ListFolderRequest,
    Permission,
    PrincipalType,
    SERVICE_KEY_SECURITY_OPENAPI,
    UpdateFolderRequest,
} from '@activepieces/shared'
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { Type } from '@sinclair/typebox'
import { StatusCodes } from 'http-status-codes'
import { entitiesMustBeOwnedByCurrentProject } from '../../authentication/authorization'
import { flowFolderService as folderService } from './folder.service'

const DEFAULT_PAGE_SIZE = 10
export const folderModule: FastifyPluginAsyncTypebox = async (app) => {
    await app.register(folderController, { prefix: '/v1/folders' })
}

const folderController: FastifyPluginAsyncTypebox = async (fastify) => {
    fastify.addHook('preSerialization', entitiesMustBeOwnedByCurrentProject)

    fastify.post('/', CreateFolderParams, async (request) => {
        const createdFolder = await folderService(request.log).upsert({
            projectId: request.principal.projectId,
            request: request.body,
        })
        return createdFolder
    },
    )

    fastify.post(
        '/:id',
        UpdateFolderParams,
        async (request) => {
            const updatedFlow = await folderService(request.log).update({
                projectId: request.principal.projectId,
                folderId: request.params.id,
                request: request.body,
            })

            return updatedFlow
        },
    )

    fastify.get(
        '/:id',
        GetFolderParams,
        async (
            request,
        ) => {
            return folderService(request.log).getOneOrThrow({
                projectId: request.principal.projectId,
                folderId: request.params.id,
            })
        },
    )

    fastify.get(
        '/',
        ListFoldersParams,
        async (request) => {
            return folderService(request.log).list({
                projectId: request.principal.projectId,
                cursorRequest: request.query.cursor ?? null,
                limit: request.query.limit ?? DEFAULT_PAGE_SIZE,
            })
        },
    )

    fastify.delete(
        '/:id',
        DeleteFolderParams,
        async (request, reply) => {
            await folderService(request.log).delete({
                projectId: request.principal.projectId,
                folderId: request.params.id,
            })
            return reply.status(StatusCodes.OK).send()
        },
    )
}


const CreateFolderParams = {
    config: {
        allowedPrincipals: [PrincipalType.USER, PrincipalType.SERVICE],
        permission: Permission.WRITE_FLOW,
    },
    schema: {
        tags: ['folders'],
        description: 'Create a new folder',
        security: [SERVICE_KEY_SECURITY_OPENAPI],
        body: CreateFolderRequest,
    },
}

const UpdateFolderParams = {
    config: {
        allowedPrincipals: [PrincipalType.USER, PrincipalType.SERVICE],
        permission: Permission.WRITE_FLOW,
    },
    schema: {
        tags: ['folders'],
        description: 'Update an existing folder',
        security: [SERVICE_KEY_SECURITY_OPENAPI],
        params: Type.Object({
            id: Type.String(),
        }),
        body: UpdateFolderRequest,
    },
}

const GetFolderParams = {
    config: {
        allowedPrincipals: [PrincipalType.USER, PrincipalType.SERVICE],
        permission: Permission.READ_FLOW,
    },
    schema: {
        tags: ['folders'],
        params: Type.Object({
            id: Type.String(),
        }),
        description: 'Get a folder by id',
        security: [SERVICE_KEY_SECURITY_OPENAPI],
    },
}

const ListFoldersParams = {
    config: {
        allowedPrincipals: [PrincipalType.USER, PrincipalType.SERVICE],
        permission: Permission.READ_FLOW,
    },
    schema: {
        tags: ['folders'],
        description: 'List folders',
        security: [SERVICE_KEY_SECURITY_OPENAPI],
        querystring: ListFolderRequest,
    },
}

const DeleteFolderParams = {
    config: {
        allowedPrincipals: [PrincipalType.USER, PrincipalType.SERVICE],
        permission: Permission.WRITE_FLOW,
    },
    schema: {
        params: DeleteFolderRequest,
        tags: ['folders'],
        description: 'Delete a folder',
        security: [SERVICE_KEY_SECURITY_OPENAPI],
    },
}