import { ActivepiecesError, ALL_PRINCIPAL_TYPES, ApId, assertNotNullOrUndefined, EnginePrincipal, ErrorCode, FileCompression, FileTransportQueryParams, FileType, isNil, Principal, PrincipalType } from '@activepieces/shared'
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { StatusCodes } from 'http-status-codes'
import { z } from 'zod'
import { accessTokenManager } from '../authentication/lib/access-token-manager'
import { securityAccess } from '../core/security/authorization/fastify-security'
import { AppSystemProp } from '../helper/system/system-props'
import { fileService } from './file.service'
import { ENGINE_WRITABLE_FILE_TYPES, filesService, fileTransportHeaders } from './files-service'
import { signedFileTransport } from './signed-file-transport'

export const filesController: FastifyPluginAsyncZod = async (app) => {
    app.put('/:fileId', {
        config: {
            security: securityAccess.unscoped(ALL_PRINCIPAL_TYPES),
        },
        schema: {
            params: z.object({ fileId: ApId }),
            querystring: FileTransportQueryParams,
            body: z.unknown(),
        },
        onRequest: async (request, reply) => {
            const fileId = (request.params as { fileId: string }).fileId
            const token = (request.query as { token: string }).token
            const principal = await verifyEnginePrincipal(token, request.log)
            const fileType = parseFileTypeHeader(request.headers[fileTransportHeaders.TYPE])
            const fileName = parseStringHeader(request.headers[fileTransportHeaders.NAME])
            const contentEncoding = parseStringHeader(request.headers['content-encoding'])
            const compression = contentEncoding === 'zstd' ? FileCompression.ZSTD : FileCompression.NONE
            const contentLength = Number(request.headers['content-length'] ?? 0)

            const readUrl = await filesService.constructReadUrl({
                fileId,
                fileType,
                platformId: principal.platform.id,
            })
            void reply.header(fileTransportHeaders.READ_URL, readUrl)

            if (!signedFileTransport.shouldRedirectForType(fileType)) {
                return
            }
            const file = await fileService(request.log).save({
                fileId,
                projectId: principal.projectId,
                platformId: principal.platform.id,
                type: fileType,
                fileName,
                compression,
                size: contentLength,
                data: null,
            })
            const redirected = await signedFileTransport.maybeRedirectToS3Put({
                reply,
                log: request.log,
                file,
                contentEncoding: compression === FileCompression.ZSTD ? 'zstd' : undefined,
            })
            if (!redirected) {
                throw new ActivepiecesError({
                    code: ErrorCode.SYSTEM_PROP_INVALID,
                    params: {
                        prop: AppSystemProp.S3_USE_SIGNED_URLS,
                    },
                }, 'S3 signed-URL redirect expected but the file row was not eligible (location or s3Key missing). Aborting to avoid a double save.')
            }
        },
    }, async (request, reply) => {
        const { fileId } = request.params
        const principal = await verifyEnginePrincipal(request.query.token, request.log)
        const fileType = parseFileTypeHeader(request.headers[fileTransportHeaders.TYPE])
        const fileName = parseStringHeader(request.headers[fileTransportHeaders.NAME])
        const contentEncoding = parseStringHeader(request.headers['content-encoding'])
        const compression = contentEncoding === 'zstd' ? FileCompression.ZSTD : FileCompression.NONE

        const data = request.body as Buffer
        assertNotNullOrUndefined(data, 'body')
        await fileService(request.log).save({
            fileId,
            projectId: principal.projectId,
            platformId: principal.platform.id,
            type: fileType,
            fileName,
            compression,
            size: data.length,
            data,
        })
        const readUrl = await filesService.constructReadUrl({
            fileId,
            fileType,
            platformId: principal.platform.id,
        })
        return reply.status(StatusCodes.OK).send({ fileId, readUrl })
    })

    app.get('/:fileId', {
        config: {
            security: securityAccess.unscoped(ALL_PRINCIPAL_TYPES),
        },
        schema: {
            params: z.object({ fileId: ApId }),
            querystring: FileTransportQueryParams,
        },
    }, async (request, reply) => {
        const { fileId } = request.params
        const { token } = request.query
        const projectId = await authorizeRead({ token, fileId, log: request.log })
        const file = await fileService(request.log).getFileOrThrow({ fileId, projectId })
        const redirected = await signedFileTransport.maybeRedirectToS3Get({
            reply,
            log: request.log,
            file,
        })
        if (redirected) {
            return
        }
        const { data } = await fileService(request.log).getDataOrThrow({
            fileId: file.id,
            projectId: file.projectId ?? undefined,
            type: file.type,
        })
        return reply
            .type('application/octet-stream')
            .header('Content-Disposition', `attachment; filename="${encodeURI(file.fileName ?? `${file.id}.bin`)}"`)
            .status(StatusCodes.OK)
            .send(data)
    })
}

export const signedStepFileController: FastifyPluginAsyncZod = async (app) => {
    app.get('/signed', {
        config: {
            security: securityAccess.public(),
        },
        schema: {
            querystring: z.object({ token: z.string() }),
        },
    }, async (request, reply) => {
        const file = await fileService(request.log).getFileByToken(request.query.token)
        const readUrl = await filesService.constructReadUrl({
            fileId: file.id,
            fileType: file.type,
            platformId: file.platformId,
        })
        return reply.redirect(readUrl)
    })
}

async function authorizeRead({ token, fileId, log }: AuthorizeReadParams): Promise<string | undefined> {
    const readToken = await tryVerifyReadToken(token, fileId)
    if (readToken) {
        return undefined
    }
    const principal = await tryVerifyEnginePrincipal(token, log)
    if (principal) {
        return principal.projectId
    }
    throw new ActivepiecesError({
        code: ErrorCode.INVALID_BEARER_TOKEN,
        params: { message: 'invalid token or expired for the file' },
    })
}

async function verifyEnginePrincipal(token: string, log: import('fastify').FastifyBaseLogger): Promise<EnginePrincipal> {
    const principal = await tryVerifyEnginePrincipal(token, log)
    if (!principal) {
        throw new ActivepiecesError({
            code: ErrorCode.INVALID_BEARER_TOKEN,
            params: { message: 'invalid engine token' },
        })
    }
    return principal
}

async function tryVerifyEnginePrincipal(token: string, log: import('fastify').FastifyBaseLogger): Promise<EnginePrincipal | null> {
    try {
        const principal: Principal = await accessTokenManager(log).verifyPrincipal(token)
        if (principal.type !== PrincipalType.ENGINE) {
            return null
        }
        return principal as EnginePrincipal
    }
    catch {
        return null
    }
}

async function tryVerifyReadToken(token: string, expectedFileId: string) {
    try {
        const payload = await filesService.verifyReadToken(token)
        if (payload.fileId !== expectedFileId) {
            return null
        }
        return payload
    }
    catch {
        return null
    }
}

function parseFileTypeHeader(value: unknown): FileType {
    const raw = parseStringHeader(value)
    if (isNil(raw) || !ENGINE_WRITABLE_FILE_TYPES.has(raw as FileType)) {
        throw new ActivepiecesError({
            code: ErrorCode.VALIDATION,
            params: { message: `Header ${fileTransportHeaders.TYPE} must be one of ${Array.from(ENGINE_WRITABLE_FILE_TYPES).join(', ')}` },
        })
    }
    return raw as FileType
}

function parseStringHeader(value: unknown): string | undefined {
    if (typeof value === 'string') {
        return value
    }
    if (Array.isArray(value) && typeof value[0] === 'string') {
        return value[0]
    }
    return undefined
}

type AuthorizeReadParams = {
    token: string
    fileId: string
    log: import('fastify').FastifyBaseLogger
}
