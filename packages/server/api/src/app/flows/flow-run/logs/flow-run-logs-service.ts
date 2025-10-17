import { File, FileCompression, FileType, UploadLogsBehavior, UploadLogsToken } from '@activepieces/shared'
import dayjs from 'dayjs'
import { FastifyBaseLogger } from 'fastify'
import { domainHelper } from '../../../ee/custom-domains/domain-helper'
import { fileService } from '../../../file/file.service'
import { JwtSignAlgorithm, jwtUtils } from '../../../helper/jwt-utils'

export const flowRunLogsService = (log: FastifyBaseLogger) => {
    return {
        async verifyToken(token: string): Promise<UploadLogsToken> {
            const payload = await jwtUtils.decodeAndVerify<UploadLogsToken>({
                jwt: token,
                key: await jwtUtils.getJwtSecret(),
                algorithm: JwtSignAlgorithm.HS256,
                issuer: null,
            })
            return payload
        },
        async constructUploadUrl(request: GenerateTokenParams): Promise<string> {
            const token = await jwtUtils.sign({
                payload: {
                    logsFileId: request.logsFileId,
                    projectId: request.projectId,
                    flowRunId: request.flowRunId,
                    behavior: request.behavior,
                },
                key: await jwtUtils.getJwtSecret(),
                algorithm: JwtSignAlgorithm.HS256,
                expiresInSeconds: dayjs.duration(100, 'year').asSeconds(),
            })
            return domainHelper.getInternalApiUrl({ path: `/v1/flow-run-logs/upload?token=${token}`, platformId: null })
        },
        async upsertMetadata(request: UploadLogsToken): Promise<void> {
            const fileExists = await fileService(log).exists({
                projectId: request.projectId,
                fileId: request.logsFileId,
                type: FileType.FLOW_RUN_LOG,
            })
            if (fileExists) {
                return
            }
            await upsertFile(request, log, null)
        },
        async uploadDirectly(request: UploadLogsToken, content: Buffer): Promise<void> {
            await upsertFile(request, log, content)
        },

    }
}

function upsertFile(request: UploadLogsToken, log: FastifyBaseLogger, content: Buffer | null): Promise<File> {
    return fileService(log).save({
        fileId: request.logsFileId,
        projectId: request.projectId,
        data: content,
        size: content?.length ?? 0,
        type: FileType.FLOW_RUN_LOG,
        compression: FileCompression.NONE,
        metadata: {
            flowRunId: request.flowRunId,
            projectId: request.projectId,
        },
    })
}

type GenerateTokenParams = {
    logsFileId: string
    projectId: string
    flowRunId: string
    behavior: UploadLogsBehavior
}