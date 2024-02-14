import { FastifyInstance, FastifyRequest } from 'fastify'
import { FileId } from '@activepieces/shared'
import { fileService } from './file.service'
import { StatusCodes } from 'http-status-codes'

export const fileController = async (fastify: FastifyInstance) => {
    fastify.get(
        '/:fileId',
        async (
            request: FastifyRequest<{
                Params: {
                    fileId: FileId
                }
            }>,
            reply,
        ) => {
            const file = await fileService.getOneOrThrow({
                projectId: request.principal.projectId,
                fileId: request.params.fileId,
            })
            return reply
                .type('application/zip')
                .status(StatusCodes.OK)
                .send(file.data)
        },
    )
}
