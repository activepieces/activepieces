import { AppSystemProp } from '@activepieces/server-shared'
import {
    ActivepiecesError,
    ALL_PRINCIPAL_TYPES,
    ErrorCode,
    File,
    FileLocation,
    FileType,
    PrincipalType,
    StepFileUpsertRequest,
} from '@activepieces/shared'
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { Type } from '@sinclair/typebox'
import { FastifyBaseLogger } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { jwtUtils } from '../../helper/jwt-utils'
import { system } from '../../helper/system/system'
import { projectService } from '../../project/project-service'
import { fileService } from '../file.service'
import { s3Helper } from '../s3-helper'
import { stepFileService } from './step-file.service'

const useS3SignedUrls = system.getBoolean(AppSystemProp.S3_USE_SIGNED_URLS)

export const stepFileController: FastifyPluginAsyncTypebox = async (app) => {
    app.get('/signed', SignedFileRequest, async (request, reply) => {
        const file = await getFileByToken(request.query.token, request.log)

        if (useS3SignedUrls && file.location === FileLocation.S3) {
            const url = await s3Helper(request.log).getS3SignedUrl(file.s3Key!, file.fileName ?? 'unknown')
            return reply
                .status(StatusCodes.TEMPORARY_REDIRECT)
                .header('Location', url)
                .send()
        }
        const { data } = await fileService(request.log).getDataOrThrow({
            fileId: file.id,
            type: FileType.FLOW_STEP_FILE,
        })
        return reply
            .header(
                'Content-Disposition',
                `attachment; filename="${encodeURI(file.fileName ?? '')}"`,
            )
            .type('application/octet-stream')
            .status(StatusCodes.OK)
            .send(data)
    })

    app.post('/', UpsertStepFileRequest, async (request) => {
        const platformId = await projectService.getPlatformId(request.principal.projectId)
        return stepFileService(request.log).saveAndEnrich({
            fileName: request.body.fileName,
            flowId: request.body.flowId,
            stepName: request.body.stepName,
            data: request.body.file?.data as Buffer | undefined,
            platformId,
            projectId: request.principal.projectId,
            contentLength: request.body.contentLength,
        })
    })
}

type FileToken = {
    fileId: string
}

async function getFileByToken(token: string, log: FastifyBaseLogger): Promise<Omit<File, 'data'>> {
    try {
        const decodedToken = await jwtUtils.decodeAndVerify<FileToken>({
            jwt: token,
            key: await jwtUtils.getJwtSecret(),
        })
        return await fileService(log).getFileOrThrow({
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
        body: StepFileUpsertRequest,
    },
}

