import { spreadIfDefined } from '@activepieces/core-utils'
import { AiStepFile, ExecuteAiJobData } from '@activepieces/shared'
import { JobContext } from '../../types'

export async function resolveAiFiles({ ctx, data }: {
    ctx: JobContext
    data: ExecuteAiJobData
}): Promise<ResolvedAiFile[]> {
    const files = data.files ?? []
    return Promise.all(files.map((file) => resolveAiFile({ ctx, data, file })))
}

async function resolveAiFile({ ctx, data, file }: {
    ctx: JobContext
    data: ExecuteAiJobData
    file: AiStepFile
}): Promise<ResolvedAiFile> {
    const stored = await ctx.apiClient.readFlowStepFile({
        projectId: data.projectId,
        platformId: data.platformId,
        fileId: file.fileId,
    })
    return {
        mimeType: file.mimeType ?? stored.mimeType ?? UNKNOWN_MIME_TYPE,
        base64: stored.data.toString('base64'),
        ...spreadIfDefined('filename', file.filename ?? stored.fileName),
    }
}

const UNKNOWN_MIME_TYPE = 'application/octet-stream'

export type ResolvedAiFile = {
    mimeType: string
    base64: string
    filename?: string
}
