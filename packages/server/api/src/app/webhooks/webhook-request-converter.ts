import { Readable } from 'stream'
import { ActivepiecesError, apId, ApMultipartFile, ErrorCode, isMultipartFile, isNil, multipartStream } from '@activepieces/core-utils'
import { EventPayload, FAIL_PARENT_ON_FAILURE_HEADER, FileCompression, FileLocation, FileType, FlowRun, PARENT_RUN_ID_HEADER } from '@activepieces/shared'
import { MultipartFile } from '@fastify/multipart'
import { FastifyBaseLogger, FastifyRequest } from 'fastify'
import mime from 'mime-types'
import { fileService } from '../file/file.service'
import { filesService } from '../file/files-service'
import { s3Helper } from '../file/s3-helper'
import { system } from '../helper/system/system'
import { AppSystemProp } from '../helper/system/system-props'

export function isBinaryContentType(contentType: string | undefined): boolean {
    if (!contentType) return false
    const baseContentType = contentType.split(';')[0].trim().toLowerCase()
    return STREAMED_BINARY_CONTENT_TYPES.some(pattern => pattern.test(baseContentType))
}

// Streaming (S3) uploads the bytes to an identity-free key at parse time and hands back a
// descriptor; buffering (non-S3) hands back the bytes. Either way the file's DB row is written
// HERE, in the handler, where projectId/platformId arrive for free via the webhook service —
// so no flow lookup is needed while the body is being parsed.
export async function convertRequest(request: FastifyRequest, context: { projectId: string, platformId: string }): Promise<EventPayload> {
    const flowId = (request.params as { flowId?: string }).flowId ?? ''
    return {
        method: request.method,
        headers: request.headers as Record<string, string>,
        body: await convertBody(request, { ...context, flowId }),
        queryParams: request.query as Record<string, string>,
        rawBody: request.rawBody,
    }
}

export function extractHeaderFromRequest(request: FastifyRequest): Pick<FlowRun, 'parentRunId' | 'failParentOnFailure'> {
    return {
        parentRunId: request.headers[PARENT_RUN_ID_HEADER] as string,
        failParentOnFailure: request.headers[FAIL_PARENT_ON_FAILURE_HEADER] === 'true',
    }
}

// Streaming is S3-only and process-constant (FILE_STORAGE_LOCATION is set at boot). On non-S3
// deployments the file bytes are buffered and saved to the DB in the handler, unchanged.
export function shouldStreamWebhookFile(request: FastifyRequest): boolean {
    return request.url.includes('/v1/webhooks/') && system.get(AppSystemProp.FILE_STORAGE_LOCATION) === FileLocation.S3
}

export async function streamWebhookBinaryBody(request: FastifyRequest, stream: Readable): Promise<StreamedFile | ApMultipartFile> {
    const baseContentType = request.headers['content-type']?.split(';')[0]
    const extension = mime.extension(baseContentType || '') || 'bin'
    const fileName = `file.${extension}`
    // A single S3 PutObject needs the length up front; a raw binary body's Content-Length is
    // exactly the file size. Without it (or on non-S3), buffer under the file cap instead.
    const size = parseContentLength(request.headers['content-length'])
    if (!shouldStreamWebhookFile(request) || isNil(size)) {
        const data = await bufferBinaryBody(stream)
        return { type: 'file', filename: fileName, data, mimetype: baseContentType }
    }
    const maxSizeBytes = system.getNumberOrThrow(AppSystemProp.MAX_STREAM_FILE_SIZE_MB) * 1024 * 1024
    if (size > maxSizeBytes) {
        throw new ActivepiecesError({
            code: ErrorCode.VALIDATION,
            params: { message: `Streamed file size ${Math.ceil(size / (1024 * 1024))}MB exceeds the ${AppSystemProp.MAX_STREAM_FILE_SIZE_MB} limit of ${maxSizeBytes / (1024 * 1024)}MB` },
        })
    }
    const fileId = apId()
    const s3Key = `${FileType.FLOW_STEP_FILE}/${fileId}`
    await s3Helper(request.log).uploadStream({ s3Key, body: stream, contentType: baseContentType, contentLength: size })
    return { type: 'streamed-file', fileId, s3Key, size, fileName, contentType: baseContentType }
}

export async function streamWebhookMultipartFile(request: FastifyRequest, part: MultipartFile): Promise<StreamedFile> {
    // Multipart parts carry no per-part Content-Length, so a single PutObject can't stream them;
    // buffer the part then upload. Memory is bounded by @fastify/multipart's own part limits.
    const data = await part.toBuffer()
    const fileId = apId()
    const s3Key = `${FileType.FLOW_STEP_FILE}/${fileId}`
    await s3Helper(request.log).uploadFile(s3Key, data)
    return { type: 'streamed-file', fileId, s3Key, size: data.length, fileName: part.filename, contentType: part.mimetype }
}

async function convertBody(request: FastifyRequest, context: WebhookFileContext): Promise<unknown> {
    if (request.isMultipart()) {
        const entries = Object.entries(request.body as Record<string, unknown>)
        const converted = await Promise.all(entries.map(async ([key, value]) => {
            if (isWebhookFile(value)) {
                return [key, await saveWebhookFile(value, context, request.log)] as const
            }
            if (Array.isArray(value) && value.every(isWebhookFile)) {
                return [key, await Promise.all(value.map((file) => saveWebhookFile(file, context, request.log)))] as const
            }
            return [key, value] as const
        }))
        return Object.fromEntries(converted)
    }
    if (isBinaryContentType(request.headers['content-type']) && isWebhookFile(request.body)) {
        return { fileUrl: await saveWebhookFile(request.body, context, request.log) }
    }
    return request.body
}

async function saveWebhookFile(value: StreamedFile | ApMultipartFile, context: WebhookFileContext, log: FastifyBaseLogger): Promise<string> {
    const { projectId, platformId, flowId } = context
    const common = {
        type: FileType.FLOW_STEP_FILE,
        projectId,
        platformId,
        metadata: { stepName: 'trigger', flowId },
        compression: FileCompression.NONE,
    } as const
    // Streamed files are already in S3 under s3Key, so save() just records the row (data: null).
    // Buffered files carry their bytes and take the normal upload/DB path.
    const file = isStreamedFile(value)
        ? await fileService(log).save({ ...common, fileId: value.fileId, s3Key: value.s3Key, data: null, size: value.size, fileName: value.fileName })
        : await fileService(log).save({ ...common, data: value.data, size: value.data.length, fileName: value.filename })
    return filesService.constructReadUrl({
        fileId: file.id,
        fileType: FileType.FLOW_STEP_FILE,
        platformId,
    })
}

async function bufferBinaryBody(stream: Readable): Promise<Buffer> {
    const maxSizeBytes = system.getNumberOrThrow(AppSystemProp.MAX_FILE_SIZE_MB) * 1024 * 1024
    return multipartStream.bufferRemaining({
        head: [],
        rest: stream,
        maxSizeBytes,
        onOverflow: () => new ActivepiecesError({
            code: ErrorCode.VALIDATION,
            params: { message: `File size exceeds the ${AppSystemProp.MAX_FILE_SIZE_MB} limit of ${maxSizeBytes / (1024 * 1024)}MB` },
        }),
    })
}

function isWebhookFile(value: unknown): value is StreamedFile | ApMultipartFile {
    return isStreamedFile(value) || isMultipartFile(value)
}

function isStreamedFile(value: unknown): value is StreamedFile {
    return typeof value === 'object' && value !== null && 'type' in value && (value as { type?: unknown }).type === 'streamed-file'
}

function parseContentLength(header: string | string[] | undefined): number | undefined {
    const raw = Array.isArray(header) ? header[0] : header
    const value = Number(raw)
    return Number.isInteger(value) && value > 0 ? value : undefined
}

// Single source of truth for "this content-type streams straight to storage".
// Each pattern matches a base type with or without params (`; charset=…`), so it is
// correct both as a fastify content-type parser (tested against the raw header) and
// via isBinaryContentType (tested against the param-stripped base type).
export const STREAMED_BINARY_CONTENT_TYPES = [
    /^image\//,
    /^video\//,
    /^audio\//,
    /^application\/pdf(;|$)/,
    /^application\/zip(;|$)/,
    /^application\/gzip(;|$)/,
    /^application\/octet-stream(;|$)/,
]

type StreamedFile = {
    type: 'streamed-file'
    fileId: string
    s3Key: string
    size: number
    fileName?: string
    contentType?: string
}

type WebhookFileContext = {
    projectId: string
    platformId: string
    flowId: string
}
