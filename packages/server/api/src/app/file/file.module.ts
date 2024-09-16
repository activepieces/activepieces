import { rejectedPromiseHandler } from '@activepieces/server-shared'
import { PrincipalType } from '@activepieces/shared'
import { FastifyPluginAsyncTypebox, Type } from '@fastify/type-provider-typebox'
import { StatusCodes } from 'http-status-codes'
import { entitiesMustBeOwnedByCurrentProject } from '../authentication/authorization'
import { fileService } from './file.service'
import { stepFileMigration } from './step-file/step-file-migration'
import { stepFileController } from './step-file/step-file.controller'

export const fileModule: FastifyPluginAsyncTypebox = async (app) => {
    rejectedPromiseHandler(stepFileMigration.migrate())
    app.addHook('preSerialization', entitiesMustBeOwnedByCurrentProject)
    await app.register(fileController, { prefix: '/v1/files' })
    await app.register(stepFileController, { prefix: '/v1/step-files' })
}

const fileController: FastifyPluginAsyncTypebox = async (app) => {
    app.get('/:fileId', GetFileRequest, async (request, reply) => {
        const { fileId } = request.params
        const { data } = await fileService.getDataOrThrow({
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
