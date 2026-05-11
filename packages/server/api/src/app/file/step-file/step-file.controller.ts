import {
    FileLocation,
    StepFileUpsertRequest,
} from '@activepieces/shared'
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { StatusCodes } from 'http-status-codes'
import { z } from 'zod'
import { securityAccess } from '../../core/security/authorization/fastify-security'
import { system } from '../../helper/system/system'
import { AppSystemProp } from '../../helper/system/system-props'
import { projectService } from '../../project/project-service'
import { fileService } from '../file.service'
import { s3Helper } from '../s3-helper'
import { stepFileService } from './step-file.service'

const useS3SignedUrls = system.getBoolean(AppSystemProp.S3_USE_SIGNED_URLS)

export const stepFileController: FastifyPluginAsyncZod = async (app) => {
    app.get('/signed', SignedFileRequest, async (request, reply) => {
        const file = await fileService(request.log).getFileByToken(request.query.token)

        if (useS3SignedUrls && file.location === FileLocation.S3) {
            const url = await s3Helper(request.log).getS3SignedUrl(file.s3Key!, file.fileName ?? 'unknown')
            return reply
                .status(StatusCodes.TEMPORARY_REDIRECT)
                .header('Location', url)
                .send()
        }
        const { data } = await fileService(request.log).getDataOrThrow({
            fileId: file.id,
            type: file.type,
        })
        return reply
            .header(
                'Content-Disposition',
                `attachment; filename="${encodeURI(file.fileName ?? `${file.id}.json`)}"`,
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
            data: fileService(request.log).extractBufferOrUndefined(request.body.file?.data),
            platformId,
            projectId: request.principal.projectId,
            contentLength: request.body.contentLength,
        })
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

