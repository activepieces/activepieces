import { AppSystemProp, system } from '@activepieces/server-shared'
import {
    ActivepiecesError,
    ALL_PRINCIPAL_TYPES,
    ErrorCode,
    File,
    FileCompression,
    FileType,
    PrincipalType,
    StepFileUpsert,
    StepFileWithUrl,
} from '@activepieces/shared'
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { Type } from '@sinclair/typebox'
import dayjs from 'dayjs'
import { StatusCodes } from 'http-status-codes'
import { domainHelper } from '../../helper/domain-helper'
import { jwtUtils } from '../../helper/jwt-utils'
import { fileService } from '../file.service'

const executionRetentionInDays = system.getNumberOrThrow(AppSystemProp.EXECUTION_DATA_RETENTION_DAYS)

export const stepFileController: FastifyPluginAsyncTypebox = async (app) => {
    app.get('/signed', SignedFileRequest, async (request, reply) => {
        const { data, fileName } = await getFileByToken(request.query.token)
        await reply
            .header(
                'Content-Disposition',
                `attachment; filename="${fileName}"`,
            )
            .type('application/octet-stream')
            .status(StatusCodes.OK)
            .send(data)
    })

    app.post('/', UpsertStepFileRequest, async (request) => {
        const file = await fileService.save({
            data: request.body.data as Buffer,
            metadata: {
                stepName: request.body.stepName,
                flowId: request.body.flowId,
            },
            fileName: request.body.fileName,
            type: FileType.FLOW_STEP_FILE,
            compression: FileCompression.NONE,
            projectId: request.principal.projectId,
        })
        return encrichWithUrl(request.hostname, file)
    })

}

type FileToken = {
    fileId: string
}

async function encrichWithUrl(
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

async function getFileByToken(token: string) {
    try {
        const decodedToken = await jwtUtils.decodeAndVerify<FileToken>({
            jwt: token,
            key: await jwtUtils.getJwtSecret(),
        })
        return await fileService.getDataOrThrow({
            fileId: decodedToken.fileId,
            type: FileType.FLOW_STEP_FILE,
        })
    }
    catch (e) {
        throw new ActivepiecesError({
            code: ErrorCode.INVALID_BEARER_TOKEN,
            params: {
                message: 'invalid token or expired for the step file',
            },
        })
    }
}

const SignedFileRequest = {
    config: {
        allowedPrincipals: ALL_PRINCIPAL_TYPES,
    },
    schema: {
        querystring: Type.Object({
            token: Type.String(),
        }),
    },
}

const UpsertStepFileRequest = {
    config: {
        allowedPrincipals: [PrincipalType.ENGINE],
    },
    schema: {
        body: StepFileUpsert,
    },
}

