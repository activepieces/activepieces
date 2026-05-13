import { FileReadToken, FileType } from '@activepieces/shared'
import dayjs from 'dayjs'
import { domainHelper } from '../ee/custom-domains/domain-helper'
import { JwtAudience, JwtSignAlgorithm, jwtUtils } from '../helper/jwt-utils'
import { system } from '../helper/system/system'
import { AppSystemProp } from '../helper/system/system-props'

const executionRetentionInDays = system.getNumberOrThrow(AppSystemProp.EXECUTION_DATA_RETENTION_DAYS)

export const filesService = {
    async verifyReadToken(token: string): Promise<FileReadToken> {
        return jwtUtils.decodeAndVerify<FileReadToken>({
            jwt: token,
            key: await jwtUtils.getJwtSecret(),
            algorithm: JwtSignAlgorithm.HS256,
            audience: JwtAudience.FILE_READ,
        })
    },
    async constructReadUrl(params: ConstructReadUrlParams): Promise<string> {
        const token = await jwtUtils.sign({
            payload: {
                fileId: params.fileId,
                fileType: params.fileType,
            },
            key: await jwtUtils.getJwtSecret(),
            algorithm: JwtSignAlgorithm.HS256,
            expiresInSeconds: dayjs.duration(executionRetentionInDays, 'days').asSeconds(),
            audience: JwtAudience.FILE_READ,
        })
        return domainHelper.getPublicApiUrl({
            path: `v1/files/${params.fileId}?token=${token}`,
            platformId: params.platformId,
        })
    },
}

export const fileTransportHeaders = {
    READ_URL: 'x-ap-file-read-url',
    TYPE: 'x-ap-file-type',
    NAME: 'x-ap-file-name',
} as const

export const ENGINE_WRITABLE_FILE_TYPES: ReadonlySet<FileType> = new Set([
    FileType.FLOW_RUN_LOG,
    FileType.FLOW_RUN_LOG_SLICE,
    FileType.FLOW_STEP_FILE,
])

type ConstructReadUrlParams = {
    fileId: string
    fileType?: FileType
    platformId: string | null | undefined
}
