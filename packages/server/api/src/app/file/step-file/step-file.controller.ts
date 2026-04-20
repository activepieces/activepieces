import {
    ActivepiecesError,
    ErrorCode,
    File,
    FileLocation,
    FileType,
    isNil,
    StepFileUpsertRequest,
    tryCatch,
} from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { StatusCodes } from 'http-status-codes'
import { z } from 'zod'
import { securityAccess } from '../../core/security/authorization/fastify-security'
import { jwtUtils } from '../../helper/jwt-utils'
import { system } from '../../helper/system/system'
import { AppSystemProp } from '../../helper/system/system-props'
import { projectService } from '../../project/project-service'
import { fileService } from '../file.service'
import { s3Helper } from '../s3-helper'
import { stepFileService } from './step-file.service'

const useS3SignedUrls = system.getBoolean(AppSystemProp.S3_USE_SIGNED_URLS)

export const stepFileController: FastifyPluginAsyncZod = async (app) => {
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
        const platformId = await projectService(request.log).getPlatformId(request.principal.projectId)
        return stepFileService(request.log).saveAndEnrich({
            fileName: request.body.fileName,
            flowId: request.body.flowId,
            stepName: request.body.stepName,
            data: extractBufferOrUndefined(request.body.file?.data),
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
    const { data, error } = await tryCatch(async () => {
        const decodedToken = await jwtUtils.decodeAndVerify<FileToken>({
            jwt: token,
            key: await jwtUtils.getJwtSecret(),
        })
        if (isNil(decodedToken.fileId)) {
            return null
        }
        return fileService(log).getFileOrThrow({
            fileId: decodedToken.fileId,
            type: FileType.FLOW_STEP_FILE,
        })
    })
    if (!isNil(error) || isNil(data)) {
        throw new ActivepiecesError({
            code: ErrorCode.INVALID_BEARER_TOKEN,
            params: { message: 'invalid token or expired for the step file' },
        })
    }
    return data
}

function extractBufferOrUndefined(value: unknown): Buffer | undefined {
    if (value === undefined || value === null) {
        return undefined
    }
    if (Buffer.isBuffer(value)) {
        return value
    }
    if (typeof value === 'string') {
        return Buffer.from(value, 'utf-8')
    }
    if (value instanceof Uint8Array) {
        return Buffer.from(value)
    }
    throw new ActivepiecesError({
        code: ErrorCode.VALIDATION,
        params: { message: 'File data must be a Buffer' },
    })
}

const SignedFileRequest = {
    config: {
        security: securityAccess.public(),
    },
    schema: {
        querystring: z.object({
            token: z.string(),
        }),
    },
}

const UpsertStepFileRequest = {
    config: {
        security: securityAccess.engine(),
    },
    schema: {
        body: StepFileUpsertRequest,
    },
}

