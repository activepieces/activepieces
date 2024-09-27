import { AppSystemProp, system } from '@activepieces/server-shared'
import {
    File,
    FileCompression,
    FileType,
    StepFileWithUrl,
} from '@activepieces/shared'
import dayjs from 'dayjs'
import { domainHelper } from '../../helper/domain-helper'
import { jwtUtils } from '../../helper/jwt-utils'
import { fileService } from '../file.service'

const executionRetentionInDays = system.getNumberOrThrow(AppSystemProp.EXECUTION_DATA_RETENTION_DAYS)

export const stepFileService = {
    async saveAndEnrich(
        params: SaveParams,
        hostname: string,
        projectId: string,
    ): Promise<StepFileWithUrl> {
        const file = await fileService.save({
            data: params.file,
            metadata: {
                stepName: params.stepName,
                flowId: params.flowId,
            },
            fileName: params.fileName,
            type: FileType.FLOW_STEP_FILE,
            compression: FileCompression.NONE,
            projectId,
        })
        return enrichWithUrl(hostname, file)
    },
}

async function enrichWithUrl(
    hostname: string,
    file: File,
): Promise<StepFileWithUrl> {
    const jwtSecret = await jwtUtils.getJwtSecret()
    const accessToken = await jwtUtils.sign({
        payload: {
            fileId: file.id,
        },
        expiresInSeconds: dayjs.duration(executionRetentionInDays, 'days').asSeconds(),
        key: jwtSecret,
    })
    const url = await domainHelper.get().constructApiUrlFromRequest({
        domain: hostname,
        path: `v1/step-files/signed?token=${accessToken}`,
    })
    return {
        ...file,
        url,
    }
}

type SaveParams = {
    fileName: string
    flowId: string
    stepName: string
    file: Buffer
}
