import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { CreateOrRenameFolderRequest, FolderId, ListFolderRequest } from '@activepieces/shared'
import { FastifyRequest } from 'fastify'
import { flowFolderService as folderService } from './folder.service'
import { StatusCodes } from 'http-status-codes'
import { Static, Type } from '@sinclair/typebox'

const DEFUALT_PAGE_SIZE = 10


const FolderIdParam = Type.Object({
    folderId: Type.String(),
})

type FolderIdParam = Static<typeof FolderIdParam>

export const folderController: FastifyPluginAsyncTypebox = async (fastify) => {

    fastify.post(
        '/',
        {
            schema: {
                body: CreateOrRenameFolderRequest,
            },
        },
        async (request) => {
            return await folderService.create({ projectId: request.principal.projectId, request: request.body })
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
            return await folderService.update({ projectId: request.principal.projectId, folderId: request.params.folderId, request: request.body })
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
            return folderService.getOne({ projectId: request.principal.projectId, folderId: request.params.folderId })
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
            return await folderService.list({ projectId: request.principal.projectId, cursorRequest: request.query.cursor ?? null, limit: request.query.limit ?? DEFUALT_PAGE_SIZE })
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
            await folderService.delete({ projectId: request.principal.projectId, folderId: request.params.folderId })
            return reply.status(StatusCodes.OK).send()
        },
    )
}
