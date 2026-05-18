import {
    ApMultipartFile,
    EventPayload,
    FAIL_PARENT_ON_FAILURE_HEADER,
    FileCompression,
    FileType,
    FlowRun,
    isMultipartFile,
    PARENT_RUN_ID_HEADER,
} from '@activepieces/shared'
import { FastifyBaseLogger, FastifyRequest } from 'fastify'
import mime from 'mime-types'
import { fileService } from '../file/file.service'
import { filesService } from '../file/files-service'
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

export async function convertRequest(
    request: FastifyRequest,
    projectId: string,
    flowId: string,
): Promise<EventPayload> {
    const contentType = request.headers['content-type']
    const isBinary = isBinaryContentType(contentType) && Buffer.isBuffer(request.body)
    return {
        method: request.method,
        headers: request.headers as Record<string, string>,
        body: await convertBody(request, projectId, flowId),
        queryParams: request.query as Record<string, string>,
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
        const jsonResult: Record<string, unknown> = {}
        const requestBodyEntries = Object.entries(
            request.body as Record<string, unknown>,
        )

        const platformId = await projectService(request.log).getPlatformId(projectId)

        for (const [key, value] of requestBodyEntries) {
            if (isMultipartFile(value)) {
                jsonResult[key] = await saveMultipartFileAsUrl({
                    file: value,
                    request,
                    flowId,
                    projectId,
                    platformId,
                })
            }
            else if (Array.isArray(value) && value.every(isMultipartFile)) {
                jsonResult[key] = await Promise.all(value.map((file) => saveMultipartFileAsUrl({
                    file,
                    request,
                    flowId,
                    projectId,
                    platformId,
                })))
            }
            else {
                jsonResult[key] = value
            }
        }
        return jsonResult
    }
    const contentType = request.headers['content-type']
    if (isBinaryContentType(contentType) && Buffer.isBuffer(request.body)) {
        const platformId = await projectService(request.log).getPlatformId(projectId)
        const extension = mime.extension(contentType?.split(';')[0] || '') || 'bin'
        const fileName = `file.${extension}`

        const url = await saveStepFileAndConstructUrl({
            log: request.log,
            data: request.body,
            fileName,
            flowId,
            contentLength: request.body.length,
            platformId,
            projectId,
        })
        return {
            fileUrl: url,
        }
    }

    return request.body
}

async function saveMultipartFileAsUrl(params: SaveMultipartFileAsUrlParams): Promise<string> {
    const { file, request, flowId, projectId, platformId } = params
    return saveStepFileAndConstructUrl({
        log: request.log,
        data: file.data,
        fileName: file.filename,
        flowId,
        contentLength: file.data.length,
        platformId,
        projectId,
    })
}

async function saveStepFileAndConstructUrl(params: SaveStepFileParams): Promise<string> {
    const { log, data, fileName, flowId, contentLength, platformId, projectId } = params
    const file = await fileService(log).save({
        data,
        metadata: { stepName: 'trigger', flowId },
        fileName,
        type: FileType.FLOW_STEP_FILE,
        compression: FileCompression.NONE,
        projectId,
        platformId,
        size: contentLength,
    })
    return filesService.constructReadUrl({
        fileId: file.id,
        fileType: FileType.FLOW_STEP_FILE,
        platformId,
    })
}

type SaveMultipartFileAsUrlParams = {
    file: ApMultipartFile
    request: FastifyRequest
    flowId: string
    projectId: string
    platformId: string
}

type SaveStepFileParams = {
    log: FastifyBaseLogger
    data: Buffer
    fileName: string
    flowId: string
    contentLength: number
    platformId: string
    projectId: string
}
