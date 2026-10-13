import { spreadIfDefined } from '@activepieces/core-utils'
import { AiStepFile, ExtractStructuredDataJobData, GenerateImageJobData, ReadFlowStepFileResponse } from '@activepieces/shared'
import pLimit from 'p-limit'
import { JobContext } from '../../types'

export async function resolveAiFiles({ ctx, data }: {
    ctx: JobContext
    data: AiStepWithFiles
}): Promise<ResolvedAiFile[]> {
    const files = data.files ?? []
    const readAtOnce = pLimit(FILES_READ_AT_ONCE)
    return Promise.all(files.map((file) => readAtOnce(() => resolveAiFile({ ctx, data, file }))))
}

async function resolveAiFile({ ctx, data, file }: {
    ctx: JobContext
    data: AiStepWithFiles
    file: AiStepFile
}): Promise<ResolvedAiFile> {
    const stored = await ctx.apiClient.readFlowStepFile({
        projectId: data.projectId,
        platformId: data.platformId,
        fileId: file.fileId,
    })
    return toResolvedAiFile({ stored, mimeType: file.mimeType, filename: file.filename })
}

export function toResolvedAiFile({ stored, mimeType, filename }: { stored: ReadFlowStepFileResponse, mimeType?: string, filename?: string }): ResolvedAiFile {
    return {
        mimeType: mimeType ?? stored.mimeType ?? UNKNOWN_MIME_TYPE,
        base64: stored.data.toString('base64'),
        ...spreadIfDefined('filename', filename ?? stored.fileName),
    }
}

const UNKNOWN_MIME_TYPE = 'application/octet-stream'
const FILES_READ_AT_ONCE = 5

export type AiStepWithFiles = ExtractStructuredDataJobData | GenerateImageJobData

export type ResolvedAiFile = {
    mimeType: string
    base64: string
    filename?: string
}
