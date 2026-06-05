import { ApId } from '@activepieces/shared'
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { StatusCodes } from 'http-status-codes'
import { z } from 'zod'
import { securityAccess } from '../core/security/authorization/fastify-security'
import { fileService } from './file.service'

export const filesController: FastifyPluginAsyncZod = async (app) => {
    app.get('/:fileId', {
        config: {
            security: securityAccess.engine(),
        },
        schema: {
            params: z.object({ fileId: ApId }),
        },
    }, async (request, reply) => {
        const { fileId } = request.params
        const { data, fileName } = await fileService(request.log).getDataOrThrow({
            fileId,
            projectId: request.principal.projectId,
        })
        return reply
            .type('application/octet-stream')
            .header('Content-Disposition', `attachment; filename="${encodeURI(fileName ?? `${fileId}.bin`)}"`)
            .status(StatusCodes.OK)
            .send(data)
    })
}
