import { PassThrough, Readable, Transform } from 'node:stream'
import { EventPayload, FAIL_PARENT_ON_FAILURE_HEADER, FileCompression, FileType, FlowRun, PARENT_RUN_ID_HEADER } from '@activepieces/shared'
import { MultipartFile } from '@fastify/multipart'
import { FastifyBaseLogger, FastifyRequest } from 'fastify'
import mime from 'mime-types'
import { fileService } from '../file/file.service'
import { enforceByteLimit, filesService, fileTooLargeError } from '../file/files-service'
import { system } from '../helper/system/system'
import { AppSystemProp } from '../helper/system/system-props'
import { projectService } from '../project/project-service'

const BINARY_CONTENT_TYPE_PATTERNS = [
    /^image\//,
    /^video\//,
    /^audio\//,
    /^application\/pdf$/,
    /^application\/zip$/,
    /^application\/gzip$/,
    /^application\/octet-stream$/,
    /^text\/csv$/,
]

const RAW_BODY_CAPTURE_LIMIT_BYTES = system.getNumberOrThrow(AppSystemProp.WEBHOOK_PAYLOAD_INLINE_THRESHOLD_KB) * 1024

export function isBinaryContentType(contentType: string | undefined): boolean {
    if (!contentType) return false
    const baseContentType = contentType.split(';')[0].trim().toLowerCase()
    return BINARY_CONTENT_TYPE_PATTERNS.some(pattern => pattern.test(baseContentType))
}

export function isMultipartContentType(contentType: string | undefined): boolean {
    return contentType?.trim().toLowerCase().startsWith('multipart/') ?? false
}

export function captureRawBodyWhileStreaming({ request, payload }: CaptureRawBodyParams): Readable {
    const capture = createBoundedRawBodyCapture(request)
    return payload.pipe(new Transform({
        transform(chunk: Buffer, _encoding, callback): void {
            capture.record(chunk)
            callback(null, chunk)
        },
        flush(callback): void {
            request.rawBody = capture.result()
            callback()
        },
    }))
}

export async function convertRequest(
    request: FastifyRequest,
    projectId: string,
    flowId: string,
): Promise<EventPayload> {
    const body = await convertBody(request, projectId, flowId)
    return {
        method: request.method,
        headers: request.headers as Record<string, string>,
        body,
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

async function convertBody(
    request: FastifyRequest,
    projectId: string,
    flowId: string,
): Promise<unknown> {
    if (request.isMultipart()) {
        const platformId = await projectService(request.log).getPlatformId(projectId)
        const maxFileSizeInBytes = system.getNumberOrThrow(AppSystemProp.MAX_FILE_SIZE_MB) * 1024 * 1024
        const jsonResult: Record<string, unknown> = {}
        // @fastify/multipart pipes request.raw itself, so the raw bytes are mirrored off the same
        // stream rather than intercepted. Attached with no await before request.parts(), so no
        // chunk can be emitted until busboy is listening too.
        const capture = createBoundedRawBodyCapture(request)
        request.raw.on('data', capture.record)
        for await (const part of request.parts()) {
            if (part.type === 'file') {
                const url = await saveStepFileAndConstructUrl({
                    log: request.log,
                    data: failIfTruncated(part.file, maxFileSizeInBytes),
                    fileName: part.filename,
                    flowId,
                    platformId,
                    projectId,
                })
                jsonResult[part.fieldname] = appendMultiValue(jsonResult[part.fieldname], url)
            }
            else {
                jsonResult[part.fieldname] = appendMultiValue(jsonResult[part.fieldname], part.value)
            }
        }
        request.rawBody = capture.result()
        return jsonResult
    }

    const contentType = request.headers['content-type']
    if (isBinaryContentType(contentType)) {
        const platformId = await projectService(request.log).getPlatformId(projectId)
        const extension = mime.extension(contentType?.split(';')[0] || '') || 'bin'
        const maxFileSizeInBytes = system.getNumberOrThrow(AppSystemProp.MAX_FILE_SIZE_MB) * 1024 * 1024
        const url = await saveStepFileAndConstructUrl({
            log: request.log,
            data: (request.body as Readable).pipe(enforceByteLimit(maxFileSizeInBytes)),
            fileName: `file.${extension}`,
            flowId,
            platformId,
            projectId,
        })
        return { fileUrl: url }
    }

    return request.body
}

async function saveStepFileAndConstructUrl(params: SaveStepFileParams): Promise<string> {
    const { log, data, fileName, flowId, platformId, projectId } = params
    const file = await fileService(log).save({
        data,
        metadata: { stepName: 'trigger', flowId },
        fileName,
        type: FileType.FLOW_STEP_FILE,
        compression: FileCompression.NONE,
        projectId,
        platformId,
    })
    return filesService.constructReadUrl({
        fileId: file.id,
        fileType: FileType.FLOW_STEP_FILE,
        platformId,
    })
}

// When a part exceeds busboy's fileSize limit it ends the stream cleanly and flags `truncated`
// rather than emitting an error, so a truncated file would otherwise be persisted before
// @fastify/multipart surfaces the limit. Erroring at end-of-stream fails the upload instead.
function failIfTruncated(file: MultipartFile['file'], maxBytes: number): Readable {
    return file.pipe(new PassThrough({
        flush(callback) {
            callback(file.truncated ? fileTooLargeError(maxBytes) : null)
        },
    }))
}

// A truncated rawBody would produce a wrong-but-plausible signature, so once the body outgrows the
// limit the retained copy is dropped and rawBody stays unset. A declared content-length over the
// limit skips accumulation entirely, so a large upload never allocates a copy it cannot keep.
function createBoundedRawBodyCapture(request: FastifyRequest): BoundedRawBodyCapture {
    const declaredLength = Number.parseInt(request.headers['content-length'] ?? '', 10)
    const chunks: Buffer[] = []
    let capturedBytes = 0
    let withinLimit = Number.isNaN(declaredLength) || declaredLength <= RAW_BODY_CAPTURE_LIMIT_BYTES
    return {
        record: (chunk: Buffer): void => {
            if (!withinLimit) {
                return
            }
            capturedBytes += chunk.length
            if (capturedBytes > RAW_BODY_CAPTURE_LIMIT_BYTES) {
                withinLimit = false
                chunks.length = 0
                return
            }
            chunks.push(chunk)
        },
        result: () => withinLimit ? Buffer.concat(chunks).toString('utf8') : undefined,
    }
}

// A repeated multipart field name collects into an array, matching the previous body shape.
function appendMultiValue(existing: unknown, value: unknown): unknown {
    if (existing === undefined) {
        return value
    }
    return Array.isArray(existing) ? [...existing, value] : [existing, value]
}

type BoundedRawBodyCapture = {
    record: (chunk: Buffer) => void
    result: () => string | undefined
}

type CaptureRawBodyParams = {
    request: FastifyRequest
    payload: Readable
}

type SaveStepFileParams = {
    log: FastifyBaseLogger
    data: Readable
    fileName: string
    flowId: string
    platformId: string
    projectId: string
}
