import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { Static, Type } from '@sinclair/typebox'
import { FastifyRequest } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { entitiesMustBeOwnedByCurrentProject } from '../../authentication/authorization'
import { eventsHooks } from '../../helper/application-events'
import { flowFolderService as folderService } from './folder.service'
import { ApplicationEventName } from '@activepieces/ee-shared'
import {
    CreateOrRenameFolderRequest,
    FolderId,
    ListFolderRequest,
} from '@activepieces/shared'

const DEFAULT_PAGE_SIZE = 10

const FolderIdParam = Type.Object({
    folderId: Type.String(),
})

type FolderIdParam = Static<typeof FolderIdParam>

export const folderController: FastifyPluginAsyncTypebox = async (fastify) => {
    fastify.addHook('preSerialization', entitiesMustBeOwnedByCurrentProject)
    fastify.post(
        '/',
        {
            schema: {
                body: CreateOrRenameFolderRequest,
            },
        },
        async (request) => {
            const createdFolder = await folderService.upsert({
                projectId: request.principal.projectId,
                request: request.body,
            })
            eventsHooks.get().sendUserEvent(request, {
                action: ApplicationEventName.FOLDER_CREATED,
                data: {
                    folder: createdFolder,
                },
            })
            return createdFolder
        },
    )

    fastify.post(
        '/:folderId',
        {
            schema: {
                params: FolderIdParam,
                body: CreateOrRenameFolderRequest,
            },
        },
        async (request) => {
            const updatedFlow = await folderService.update({
                projectId: request.principal.projectId,
                folderId: request.params.folderId,
                request: request.body,
            })

            eventsHooks.get().sendUserEvent(request, {
                action: ApplicationEventName.FOLDER_UPDATED,
                data: {
                    folder: updatedFlow,
                },
            })

            return updatedFlow
        },
    )

    fastify.get(
        '/:folderId',
        async (
            request: FastifyRequest<{
                Params: {
                    folderId: FolderId
                }
            }>,
        ) => {
            return folderService.getOneOrThrow({
                projectId: request.principal.projectId,
                folderId: request.params.folderId,
            })
        },
    )

    fastify.get(
        '/',
        {
            schema: {
                querystring: ListFolderRequest,
            },
        },
        async (request) => {
            return folderService.list({
                projectId: request.principal.projectId,
                cursorRequest: request.query.cursor ?? null,
                limit: request.query.limit ?? DEFAULT_PAGE_SIZE,
            })
        },
    )

    fastify.delete(
        '/:folderId',
        async (
            request: FastifyRequest<{
                Params: {
                    folderId: FolderId
                }
            }>,
            reply,
        ) => {
            const folder = await folderService.getOneOrThrow({
                projectId: request.principal.projectId,
                folderId: request.params.folderId,
            })
            eventsHooks.get().sendUserEvent(request, {
                action: ApplicationEventName.FOLDER_DELETED,
                data: {
                    folder,
                },
            })
            await folderService.delete({
                projectId: request.principal.projectId,
                folderId: request.params.folderId,
            })
            return reply.status(StatusCodes.OK).send()
        },
    )
}
