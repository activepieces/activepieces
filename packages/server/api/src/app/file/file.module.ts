import { PrincipalType } from '@activepieces/shared'
import { FastifyPluginAsyncTypebox, Type } from '@fastify/type-provider-typebox'
import { StatusCodes } from 'http-status-codes'
import { fileService } from './file.service'

export const fileModule: FastifyPluginAsyncTypebox = async (app) => {
    await app.register(fileController, { prefix: '/v1/files' })
}

const fileController: FastifyPluginAsyncTypebox = async (app) => {
    app.get('/:fileId', GetFileRequest, async (request, reply) => {
        const { fileId } = request.params
        const data = await fileService.getDataOrThrow({
            projectId: request.principal.projectId,
            fileId,
        })
        return reply
            .type('application/zip')
            .status(StatusCodes.OK)
            .send(data)
    })
}

const GetFileRequest = {
    config: {
        allowedPrincipals: [PrincipalType.USER],
    },
    schema: {
        params: Type.Object({
            fileId: Type.String(),
        }),
    },
}
