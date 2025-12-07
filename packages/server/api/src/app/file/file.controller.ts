import { ALL_PRINCIPAL_TYPES, FileCompression, isMultipartFile, PrincipalType, UploadFileRequestBody } from '@activepieces/shared'
import { FastifyPluginAsyncTypebox, Type } from '@fastify/type-provider-typebox'
import { StatusCodes } from 'http-status-codes'
import { projectService } from '../project/project-service'
import { fileService } from './file.service'

export const fileController: FastifyPluginAsyncTypebox = async (app) => {
    app.get('/:fileId', GetFileRequest, async (request, reply) => {
        const fileId = request.params.fileId
        const file = await fileService(request.log).getFileOrThrow({ fileId })
        const data = await fileService(request.log).getDataOrThrow({ fileId })

        return reply
            .header(
                'Content-Disposition',
                `attachment; filename="${encodeURI(file.fileName ?? '')}"`,
            )
            .type(file.metadata?.mimetype ?? 'application/octet-stream')
            .status(StatusCodes.OK)
            .send(data.data)
    }),

    app.post('/upload', UploadFileRequest, async (request, reply) => {
        if (!request.isMultipart()) {
            return reply.status(StatusCodes.BAD_REQUEST).send({
                message: 'Request must be multipart/form-data',
            })
        }

        const body = request.body
        const file = body.file

        if (!isMultipartFile(file)) {
            return reply.status(StatusCodes.BAD_REQUEST).send({
                message: 'File field is required and must be a valid file',
            })
        }

        const platformId = await projectService.getPlatformId(request.principal.projectId)

        return fileService(request.log).save({
            projectId: request.principal.projectId,
            platformId,
            data: file.data as Buffer,
            type: request.body.fileType,
            fileName: file.filename,
            size: file.data.length,
            compression: FileCompression.NONE,
            metadata: {
                mimetype: file.mimetype ?? '',
            },
        })
    })
}

const GetFileRequest = {
    config: {
        allowedPrincipals: ALL_PRINCIPAL_TYPES,
    },
    schema: {
        description: 'Get a file',
        params: Type.Object({
            fileId: Type.String(),
        }),
    },
} as const

const UploadFileRequest = {
    config: {
        allowedPrincipals: [PrincipalType.USER] as const,
    },
    schema: {
        description: 'Upload a file',
        consumes: ['multipart/form-data'],
        body: UploadFileRequestBody,
    },
}
