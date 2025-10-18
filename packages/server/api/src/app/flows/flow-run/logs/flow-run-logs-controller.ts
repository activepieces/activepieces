import { ActivepiecesError, ALL_PRINCIPAL_TYPES, ErrorCode, FileType, isNil, UploadLogsBehavior, UploadLogsQueryParams } from '@activepieces/shared'
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { Type } from '@sinclair/typebox'
import { StatusCodes } from 'http-status-codes'
import { s3Helper } from '../../../file/s3-helper'
import { flowRunLogsService } from './flow-run-logs-service'

export const flowRunLogsController: FastifyPluginAsyncTypebox = async (app) => {
    app.put('/logs', {
        config: {
            allowedPrincipals: ALL_PRINCIPAL_TYPES,
        },
        schema: {
            querystring: UploadLogsQueryParams,
            body: Type.Unknown(),
        },
        onRequest: async (request, reply) => {
            const { token } = request.query as { token: string }
            const decodedToken = await flowRunLogsService(request.log).verifyToken(token)
            if (decodedToken.behavior === UploadLogsBehavior.REDIRECT_TO_S3) {
                const s3Key = await s3Helper(request.log).constructS3Key(undefined, decodedToken.projectId, FileType.FLOW_RUN_LOG, decodedToken.logsFileId)
                const s3SignedUrl = await s3Helper(request.log).putS3SignedUrl(s3Key)
                request.log.info({
                    s3Key,
                }, 'Redirecting to S3 signed URL')
                await flowRunLogsService(request.log).upsertMetadata(decodedToken)
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
            allowedPrincipals: ALL_PRINCIPAL_TYPES,
        },
        schema: {
            querystring: UploadLogsQueryParams,
        },
    }, async (request, reply) => {
        const { token } = request.query
        const decodedToken = await flowRunLogsService(request.log).verifyToken(token)
        if (decodedToken.behavior === UploadLogsBehavior.REDIRECT_TO_S3) {
            const s3Key = await s3Helper(request.log).constructS3Key(undefined, decodedToken.projectId, FileType.FLOW_RUN_LOG, decodedToken.logsFileId)
            const s3SignedUrl = await s3Helper(request.log).getS3SignedUrl(s3Key, decodedToken.logsFileId)
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
