import { securityAccess } from '@activepieces/server-shared'
import { ActivepiecesError, ALL_PRINCIPAL_TYPES, assertNotNullOrUndefined, ErrorCode, FileType, isNil, UploadLogsBehavior, UploadLogsQueryParams } from '@activepieces/shared'
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { Type } from '@sinclair/typebox'
import { StatusCodes } from 'http-status-codes'
import { fileService } from '../../../file/file.service'
import { s3Helper } from '../../../file/s3-helper'
import { flowRunLogsService } from './flow-run-logs-service'

export const flowRunLogsController: FastifyPluginAsyncTypebox = async (app) => {
    app.put('/logs', {
        config: {
            security: securityAccess.unscoped(ALL_PRINCIPAL_TYPES),
        },
        schema: {
            querystring: UploadLogsQueryParams,
            body: Type.Unknown(),
        },
        onRequest: async (request, reply) => {
            const { token } = request.query as { token: string }
            const decodedToken = await flowRunLogsService(request.log).verifyToken(token)
            if (decodedToken.behavior === UploadLogsBehavior.REDIRECT_TO_S3) {
                const fileMetadata = await flowRunLogsService(request.log).upsertMetadata(decodedToken)
                const s3SignedUrl = await s3Helper(request.log).putS3SignedUrl(fileMetadata.s3Key!)
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
        const logs = await flowRunLogsService(request.log).getLogs(decodedToken)
        if (isNil(logs)) {
            throw new ActivepiecesError({
                code: ErrorCode.FILE_NOT_FOUND,
                params: {
                    id: decodedToken.logsFileId,
                },
            })
        }
        return reply.send(logs)
    })
}
