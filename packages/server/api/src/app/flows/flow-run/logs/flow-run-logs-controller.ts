import { securityAccess } from '@activepieces/server-common'
import { ActivepiecesError, ALL_PRINCIPAL_TYPES, assertNotNullOrUndefined, CONTENT_ENCODING_ZSTD, ErrorCode, FileCompression, FileType, isNil, isZstdCompressed, UploadLogsBehavior, UploadLogsQueryParams } from '@activepieces/shared'
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { StatusCodes } from 'http-status-codes'
import { z } from 'zod'
import { fileService } from '../../../file/file.service'
import { s3Helper } from '../../../file/s3-helper'
import { flowRunLogsService } from './flow-run-logs-service'

export const flowRunLogsController: FastifyPluginAsyncZod = async (app) => {
    app.put('/logs', {
        config: {
            security: securityAccess.unscoped(ALL_PRINCIPAL_TYPES),
        },
        schema: {
            querystring: UploadLogsQueryParams,
            body: z.unknown(),
        },
        onRequest: async (request, reply) => {
            const { token } = request.query as { token: string }
            const decodedToken = await flowRunLogsService(request.log).verifyToken(token)
            if (decodedToken.behavior === UploadLogsBehavior.REDIRECT_TO_S3) {
                const fileMetadata = await flowRunLogsService(request.log).upsertMetadata(decodedToken)
                const s3SignedUrl = await s3Helper(request.log).putS3SignedUrl(fileMetadata.s3Key!, undefined, CONTENT_ENCODING_ZSTD)
                request.log.info({
                    s3Key: fileMetadata.s3Key,
                }, 'Redirecting to S3 signed URL')
                return reply.redirect(s3SignedUrl)
            }
        },
    }, async (request, reply) => {
        const { token } = request.query
        const content = request.body as Buffer
        const decodedToken = await flowRunLogsService(request.log).verifyToken(token)
        request.log.info({
            logsFileId: decodedToken.logsFileId,
        }, 'Uploading logs directly')
        await flowRunLogsService(request.log).uploadDirectly(decodedToken, content)
        return reply.status(StatusCodes.OK).send()
    })

    app.get('/logs', {
        config: {
            security: securityAccess.unscoped(ALL_PRINCIPAL_TYPES),
        },
        schema: {
            querystring: UploadLogsQueryParams,
        },
    }, async (request, reply) => {
        const { token } = request.query
        const decodedToken = await flowRunLogsService(request.log).verifyToken(token)
        const file = await fileService(request.log).getFileOrThrow({
            projectId: decodedToken.projectId,
            fileId: decodedToken.logsFileId,
            type: FileType.FLOW_RUN_LOG,
        })
        if (decodedToken.behavior === UploadLogsBehavior.REDIRECT_TO_S3) {
            assertNotNullOrUndefined(file.s3Key, 's3Key')
            const s3SignedUrl = await s3Helper(request.log).getS3SignedUrl(file.s3Key, file.fileName ?? file.id)
            return reply.redirect(s3SignedUrl)
        }
        const rawLogs = await flowRunLogsService(request.log).getRawLogs(decodedToken)
        if (isNil(rawLogs)) {
            throw new ActivepiecesError({
                code: ErrorCode.ENTITY_NOT_FOUND,
                params: {
                    entityType: 'file',
                    entityId: decodedToken.logsFileId,
                    message: 'Logs file not found',
                },
            })
        }
        const isCompressed = rawLogs.compression === FileCompression.ZSTD || isZstdCompressed(rawLogs.data)
        if (isCompressed) {
            void reply.header('Content-Encoding', CONTENT_ENCODING_ZSTD)
        }
        return reply.type('application/octet-stream').send(rawLogs.data)
    })
}
