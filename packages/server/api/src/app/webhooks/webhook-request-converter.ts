import { Readable } from 'stream'
import { assertNotNullOrUndefined } from '@activepieces/core-utils'
import { EventPayload, FAIL_PARENT_ON_FAILURE_HEADER, FileType, FlowRun, PARENT_RUN_ID_HEADER } from '@activepieces/shared'
import { MultipartFile } from '@fastify/multipart'
import { FastifyRequest } from 'fastify'
import mime from 'mime-types'
import { fileService } from '../file/file.service'
import { filesService } from '../file/files-service'

const BINARY_CONTENT_TYPE_PATTERNS = [
    /^image\//,
    /^video\//,
    /^audio\//,
    /^application\/pdf$/,
    /^application\/zip$/,
    /^application\/gzip$/,
    /^application\/octet-stream$/,
]

export function isBinaryContentType(contentType: string | undefined): boolean {
    if (!contentType) return false
    const baseContentType = contentType.split(';')[0].trim().toLowerCase()
    return BINARY_CONTENT_TYPE_PATTERNS.some(pattern => pattern.test(baseContentType))
}

// Both streaming paths save the file while the request body is still being parsed (binary in the
// content-type parser, multipart in the global onFile hook), replacing the value with a readUrl.
// So convertRequest only ever passes the already-converted body through.
export async function convertRequest(request: FastifyRequest): Promise<EventPayload> {
    return {
        method: request.method,
        headers: request.headers as Record<string, string>,
        body: request.body,
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

export async function streamWebhookBinaryBody(request: FastifyRequest, stream: Readable): Promise<{ fileUrl: string }> {
    const baseContentType = request.headers['content-type']?.split(';')[0]
    const extension = mime.extension(baseContentType || '') || 'bin'
    const url = await streamToStepFileUrl({
        request,
        stream,
        fileName: `file.${extension}`,
        contentType: baseContentType,
    })
    return { fileUrl: url }
}

export async function streamWebhookMultipartFile(request: FastifyRequest, part: MultipartFile): Promise<string> {
    return streamToStepFileUrl({
        request,
        stream: part.file,
        fileName: part.filename,
        contentType: part.mimetype,
    })
}

async function streamToStepFileUrl(params: StreamToStepFileUrlParams): Promise<string> {
    const { request, stream, fileName, contentType } = params
    const { projectId, platformId, flowId } = getWebhookContextOrThrow(request)
    const file = await fileService(request.log).saveStream({
        stream,
        fileName,
        type: FileType.FLOW_STEP_FILE,
        projectId,
        platformId,
        metadata: { stepName: 'trigger', flowId },
        contentType,
    })
    return filesService.constructReadUrl({
        fileId: file.id,
        fileType: FileType.FLOW_STEP_FILE,
        platformId,
    })
}

function getWebhookContextOrThrow(request: FastifyRequest): NonNullable<FastifyRequest['webhookContext']> {
    assertNotNullOrUndefined(request.webhookContext, 'webhookContext')
    return request.webhookContext
}

type StreamToStepFileUrlParams = {
    request: FastifyRequest
    stream: Readable
    fileName?: string
    contentType?: string
}
