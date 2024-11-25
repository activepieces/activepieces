import { AppSystemProp, system } from '@activepieces/server-shared'
import {
    File,
    FileCompression,
    FileType,
    isNil,
    StepFileUpsertResponse,
} from '@activepieces/shared'
import dayjs from 'dayjs'
import { domainHelper } from '../../helper/domain-helper'
import { jwtUtils } from '../../helper/jwt-utils'
import { fileService } from '../file.service'
import { s3Helper } from '../s3-helper'

const executionRetentionInDays = system.getNumberOrThrow(AppSystemProp.EXECUTION_DATA_RETENTION_DAYS)

export const stepFileService = {
    async saveAndEnrich(params: SaveParams): Promise<StepFileUpsertResponse> {
        const file = await fileService.save({
            data: params.data ?? null,
            metadata: {
                stepName: params.stepName,
                flowId: params.flowId,
            },
            fileName: params.fileName,
            type: FileType.FLOW_STEP_FILE,
            compression: FileCompression.NONE,
            projectId: params.projectId,
            size: params.contentLength,
        })
        return {
            uploadUrl: await constructUploadUrl(file.s3Key, params.data, params.contentLength),
            url: await constructDownloadUrl(params.hostname, file),
        }
    },
}

async function constructUploadUrl(s3Key: string | undefined, data: Buffer | undefined, contentLength: number): Promise<string | undefined> {
    const dataSent = !isNil(data)
    const isNotS3 = isNil(s3Key)
    if (isNotS3 || dataSent) {
        return undefined
    }
    return s3Helper.putS3SignedUrl(s3Key, contentLength)
}

async function constructDownloadUrl(hostname: string, file: File): Promise<string> {
    const accessToken = await jwtUtils.sign({
        payload: {
            fileId: file.id,
        },
        expiresInSeconds: dayjs.duration(executionRetentionInDays, 'days').asSeconds(),
        key: await jwtUtils.getJwtSecret(),
    })
    return domainHelper.get().constructApiUrlFromRequest({
        domain: hostname,
        path: `v1/step-files/signed?token=${accessToken}`,
    })
}

type SaveParams = {
    fileName: string
    flowId: string
    stepName: string
    data: Buffer | undefined
    contentLength: number
    hostname: string
    projectId: string
}
