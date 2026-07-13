import { ApId } from '@activepieces/core-utils'
import { FileType } from '@activepieces/shared'
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { StatusCodes } from 'http-status-codes'
import { z } from 'zod'
import { securityAccess } from '../core/security/authorization/fastify-security'
import { multipartUploadService } from './multipart-upload.service'

export const multipartUploadController: FastifyPluginAsyncZod = async (app) => {
    app.post('/:fileId/multipart-uploads', {
        config: {
            security: securityAccess.engine(),
        },
        schema: {
            params: z.object({ fileId: ApId }),
            body: CreateMultipartUploadRequest,
        },
    }, async (request) => {
        const { fileId } = request.params
        const { type, fileName, contentType } = request.body
        const { projectId, platform } = request.principal
        return multipartUploadService.create({
            fileId,
            type,
            fileName,
            contentType,
            projectId,
            platformId: platform.id,
            log: request.log,
        })
    })

    app.post('/:fileId/multipart-uploads/part-url', {
        config: {
            security: securityAccess.engine(),
        },
        schema: {
            params: z.object({ fileId: ApId }),
            body: z.object({
                uploadId: z.string().min(1),
                partNumber: z.number().int().min(1).max(10000),
            }),
        },
    }, async (request) => {
        const url = await multipartUploadService.getPartUrl({
            fileId: request.params.fileId,
            projectId: request.principal.projectId,
            uploadId: request.body.uploadId,
            partNumber: request.body.partNumber,
            log: request.log,
        })
        return { url }
    })

    app.post('/:fileId/multipart-uploads/complete', {
        config: {
            security: securityAccess.engine(),
        },
        schema: {
            params: z.object({ fileId: ApId }),
            body: z.object({
                uploadId: z.string().min(1),
                parts: z.array(z.object({
                    partNumber: z.number().int().min(1),
                    etag: z.string().min(1),
                })).min(1),
            }),
        },
    }, async (request) => {
        const { fileId } = request.params
        const { projectId, platform } = request.principal
        return multipartUploadService.complete({
            fileId,
            projectId,
            platformId: platform.id,
            uploadId: request.body.uploadId,
            parts: request.body.parts,
            log: request.log,
        })
    })

    app.post('/:fileId/multipart-uploads/abort', {
        config: {
            security: securityAccess.engine(),
        },
        schema: {
            params: z.object({ fileId: ApId }),
            body: z.object({ uploadId: z.string().min(1) }),
        },
    }, async (request, reply) => {
        await multipartUploadService.abort({
            fileId: request.params.fileId,
            projectId: request.principal.projectId,
            uploadId: request.body.uploadId,
            log: request.log,
        })
        return reply.status(StatusCodes.NO_CONTENT).send()
    })
}

const CreateMultipartUploadRequest = z.object({
    type: z.literal(FileType.FLOW_STEP_FILE),
    fileName: z.string().optional(),
    contentType: z.string().optional(),
})
