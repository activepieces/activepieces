import { ApplicationEventName } from '@activepieces/ee-shared'
import { ProjectResourceType, securityAccess } from '@activepieces/server-shared'
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
import { applicationEvents } from '../../helper/application-events'
import { FolderEntity } from './folder.entity'
import { flowFolderService as folderService } from './folder.service'

const DEFAULT_PAGE_SIZE = 10
export const folderModule: FastifyPluginAsyncTypebox = async (app) => {
    await app.register(folderController, { prefix: '/v1/folders' })
}

const folderController: FastifyPluginAsyncTypebox = async (fastify) => {
    fastify.addHook('preSerialization', entitiesMustBeOwnedByCurrentProject)

    fastify.post('/', CreateFolderParams, async (request) => {
        const createdFolder = await folderService(request.log).upsert({
            projectId: request.projectId,
            request: request.body,
        })
        applicationEvents.sendUserEvent(request, {
            action: ApplicationEventName.FOLDER_CREATED,
            data: {
                folder: createdFolder,
            },
        })
        return createdFolder
    },
    )

    fastify.post(
        '/:id',
        UpdateFolderParams,
        async (request) => {
            const updatedFlow = await folderService(request.log).update({
                projectId: request.projectId,
                folderId: request.params.id,
                request: request.body,
            })

            applicationEvents.sendUserEvent(request, {
                action: ApplicationEventName.FOLDER_UPDATED,
                data: {
                    folder: updatedFlow,
                },
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
                projectId: request.projectId,
                folderId: request.params.id,
            })
        },
    )

    fastify.get(
        '/',
        ListFoldersParams,
        async (request) => {
            return folderService(request.log).list({
                projectId: request.projectId,
                cursorRequest: request.query.cursor ?? null,
                limit: request.query.limit ?? DEFAULT_PAGE_SIZE,
            })
        },
    )

    fastify.delete(
        '/:id',
        DeleteFolderParams,
        async (request, reply) => {
            const folder = await folderService(request.log).getOneOrThrow({
                projectId: request.projectId,
                folderId: request.params.id,
            })
            applicationEvents.sendUserEvent(request, {
                action: ApplicationEventName.FOLDER_DELETED,
                data: {
                    folder,
                },
            })
            await folderService(request.log).delete({
                projectId: request.projectId,
                folderId: request.params.id,
            })
            return reply.status(StatusCodes.OK).send()
        },
    )
}


const CreateFolderParams = {
    config: {
        security: securityAccess.project(
            [PrincipalType.USER, PrincipalType.SERVICE], 
            Permission.WRITE_FLOW, {
                type: ProjectResourceType.BODY,
            }),
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
        security: securityAccess.project(
            [PrincipalType.USER, PrincipalType.SERVICE], 
            Permission.WRITE_FLOW, {
                type: ProjectResourceType.TABLE,
                tableName: FolderEntity,
            }),
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
        security: securityAccess.project(
            [PrincipalType.USER, PrincipalType.SERVICE], 
            Permission.READ_FLOW, {
                type: ProjectResourceType.TABLE,
                tableName: FolderEntity,
            }),
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
        security: securityAccess.project(
            [PrincipalType.USER, PrincipalType.SERVICE], 
            Permission.READ_FLOW, {
                type: ProjectResourceType.QUERY,
            }),
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
        security: securityAccess.project(
            [PrincipalType.USER, PrincipalType.SERVICE], 
            Permission.WRITE_FLOW, {
                type: ProjectResourceType.TABLE,
                tableName: FolderEntity,
            }),
    },
    schema: {
        params: DeleteFolderRequest,
        tags: ['folders'],
        description: 'Delete a folder',
        security: [SERVICE_KEY_SECURITY_OPENAPI],
    },
}