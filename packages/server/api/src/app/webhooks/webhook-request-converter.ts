import {
    EventPayload,
    FAIL_PARENT_ON_FAILURE_HEADER,
    FlowRun,
    isMultipartFile,
    PARENT_RUN_ID_HEADER,
} from '@activepieces/shared'
import { FastifyRequest } from 'fastify'
import mime from 'mime-types'
import { stepFileService } from '../file/step-file/step-file.service'
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
                const file = await stepFileService(request.log).saveAndEnrich({
                    data: value.data as Buffer,
                    fileName: value.filename,
                    stepName: 'trigger',
                    flowId,
                    contentLength: value.data.length,
                    platformId,
                    projectId,
                })
                jsonResult[key] = file.url
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

        const file = await stepFileService(request.log).saveAndEnrich({
            data: request.body,
            fileName,
            stepName: 'trigger',
            flowId,
            contentLength: request.body.length,
            platformId,
            projectId,
        })
        return {
            fileUrl: file.url,
        }
    }

    return request.body
}
