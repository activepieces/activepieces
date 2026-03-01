import { ExecutioOutputFile, File, FileCompression, FileType, isNil, UploadLogsBehavior, UploadLogsToken } from '@activepieces/shared'
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
            return domainHelper.getApiUrlForWorker({ path: `/v1/flow-runs/logs?token=${token}`, platformId: null })
        },
        async upsertMetadata(request: UploadLogsToken): Promise<File> {
            const file = await fileService(log).getFile({
                projectId: request.projectId,
                fileId: request.logsFileId,
                type: FileType.FLOW_RUN_LOG,
            })
            if (!isNil(file)) {
                return file
            }
            return upsertFile(request, log, null)
        },
        async uploadDirectly(request: UploadLogsToken, content: Buffer): Promise<void> {
            await upsertFile(request, log, content)
        },
        async getLogs(request: GetLogsParams): Promise<ExecutioOutputFile | null> {
            const file = await fileService(log).getDataOrUndefined({
                fileId: request.logsFileId,
                projectId: request.projectId,
            })
            if (isNil(file)) {
                return null
            }
            return JSON.parse(file.data.toString('utf-8'))
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

type GetLogsParams = {
    logsFileId: string
    projectId: string
}

type GenerateTokenParams = {
    logsFileId: string
    projectId: string
    flowRunId: string
    behavior: UploadLogsBehavior
}