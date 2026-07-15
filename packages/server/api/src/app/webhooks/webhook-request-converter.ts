import { Readable } from 'node:stream'
import { EventPayload, FAIL_PARENT_ON_FAILURE_HEADER, FileCompression, FileType, FlowRun, PARENT_RUN_ID_HEADER } from '@activepieces/shared'
import { FastifyBaseLogger, FastifyRequest } from 'fastify'
import mime from 'mime-types'
import { fileService } from '../file/file.service'
import { enforceByteLimit, filesService } from '../file/files-service'
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
]

export function isBinaryContentType(contentType: string | undefined): boolean {
    if (!contentType) return false
    const baseContentType = contentType.split(';')[0].trim().toLowerCase()
    return BINARY_CONTENT_TYPE_PATTERNS.some(pattern => pattern.test(baseContentType))
}

export function isMultipartContentType(contentType: string | undefined): boolean {
    return contentType?.trim().toLowerCase().startsWith('multipart/') ?? false
}

export async function convertRequest(
    request: FastifyRequest,
    projectId: string,
    flowId: string,
): Promise<EventPayload> {
    const contentType = request.headers['content-type']
    const isBinary = isBinaryContentType(contentType)
    return {
        method: request.method,
        headers: request.headers as Record<string, string>,
        body: await convertBody(request, projectId, flowId),
        queryParams: request.query as Record<string, string>,
        // Streamed bodies (binary/multipart) are consumed straight to storage, so there is no
        // raw payload to forward; rawBody is captured only for the string-parsed signed types.
        rawBody: isBinary ? undefined : request.rawBody,
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
        const jsonResult: Record<string, unknown> = {}
        for await (const part of request.parts()) {
            if (part.type === 'file') {
                const url = await saveStepFileAndConstructUrl({
                    log: request.log,
                    data: part.file,
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

// A repeated multipart field name collects into an array, matching the previous body shape.
function appendMultiValue(existing: unknown, value: unknown): unknown {
    if (existing === undefined) {
        return value
    }
    return Array.isArray(existing) ? [...existing, value] : [existing, value]
}

type SaveStepFileParams = {
    log: FastifyBaseLogger
    data: Readable
    fileName: string
    flowId: string
    platformId: string
    projectId: string
}
