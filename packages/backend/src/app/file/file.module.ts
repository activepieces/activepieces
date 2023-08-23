import { FileId } from '@activepieces/shared'
import { FastifyInstance, FastifyRequest } from 'fastify'
import { fileService } from './file.service'
import { StatusCodes } from 'http-status-codes'

export const fileModule = async (app: FastifyInstance) => {
    app.register(fileController, { prefix: '/v1/files' })
}

const fileController = async (fastify: FastifyInstance) => {
    fastify.get(
        '/:fileId',
        async (
            request: FastifyRequest<{
                Params: {
                    fileId: FileId
                }
            }>,
            _reply,
        ) => {
            const file = await fileService.getOneOrThrow({ projectId: request.principal.projectId, fileId: request.params.fileId })
            _reply.type('application/zip').status(StatusCodes.OK).send(file.data)
        },
    )
}
