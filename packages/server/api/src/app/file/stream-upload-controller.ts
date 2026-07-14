import { ApId } from '@activepieces/core-utils'
import { FileType } from '@activepieces/shared'
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { securityAccess } from '../core/security/authorization/fastify-security'
import { streamUploadService } from './stream-upload.service'

export const streamUploadController: FastifyPluginAsyncZod = async (app) => {
    app.post('/:fileId/stream-upload', {
        config: {
            security: securityAccess.engine(),
        },
        schema: {
            params: z.object({ fileId: ApId }),
            body: CreateStreamUploadRequest,
        },
    }, async (request) => {
        const { fileId } = request.params
        const { type, fileName, contentType, size } = request.body
        const { projectId, platform } = request.principal
        return streamUploadService.create({
            fileId,
            type,
            fileName,
            contentType,
            size,
            projectId,
            platformId: platform.id,
            log: request.log,
        })
    })
}

const CreateStreamUploadRequest = z.object({
    type: z.literal(FileType.FLOW_STEP_FILE),
    fileName: z.string().optional(),
    contentType: z.string().optional(),
    size: z.number().int().min(0),
})
