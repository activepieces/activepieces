import { AiStepAction, ExecuteAiJobData, ReadFlowStepFileRequest, ReadFlowStepFileResponse } from '@activepieces/shared'
import { describe, expect, it } from 'vitest'
import { resolveAiFiles } from '../../../../../src/lib/execute/jobs/ai/ai-files'

const PDF_BYTES = Buffer.from('%PDF-1.7 a small invoice')

function contextReading(stored: Record<string, ReadFlowStepFileResponse>): Parameters<typeof resolveAiFiles>[0]['ctx'] {
    const requests: ReadFlowStepFileRequest[] = []
    const ctx = {
        apiClient: {
            readFlowStepFile: async (input: ReadFlowStepFileRequest) => {
                requests.push(input)
                const found = stored[input.fileId]
                if (found === undefined) {
                    throw new Error(`no such file ${input.fileId}`)
                }
                return found
            },
        },
        requests,
    }
    return ctx as unknown as Parameters<typeof resolveAiFiles>[0]['ctx']
}

function jobData(files: ExecuteAiJobData['files']): ExecuteAiJobData {
    return {
        requestId: 'request-1',
        projectId: 'project-1',
        platformId: 'platform-1',
        flowId: 'flow-1',
        flowRunId: 'run-1',
        waitpointId: 'waitpoint-1',
        action: AiStepAction.enum.EXTRACT_STRUCTURED_DATA,
        provider: 'openai',
        modelId: 'gpt-4o',
        files,
    } as ExecuteAiJobData
}

describe('resolveAiFiles', () => {
    it('fetches the bytes by id, scoped to the job project and platform', async () => {
        const ctx = contextReading({ 'file-1': { data: PDF_BYTES, mimeType: 'application/pdf' } })

        const resolved = await resolveAiFiles({ ctx, data: jobData([{ fileId: 'file-1' }]) })

        expect(resolved).toEqual([{ mimeType: 'application/pdf', base64: PDF_BYTES.toString('base64') }])
        expect((ctx as unknown as { requests: ReadFlowStepFileRequest[] }).requests).toEqual([
            { projectId: 'project-1', platformId: 'platform-1', fileId: 'file-1' },
        ])
    })

    it('prefers the mime type the caller sent over the one the file was stored with', async () => {
        const ctx = contextReading({ 'file-1': { data: PDF_BYTES, mimeType: 'application/octet-stream' } })

        const resolved = await resolveAiFiles({ ctx, data: jobData([{ fileId: 'file-1', mimeType: 'application/pdf' }]) })

        expect(resolved[0].mimeType).toBe('application/pdf')
    })

    it('falls back to the stored mime type when the caller sent none', async () => {
        const ctx = contextReading({ 'file-1': { data: PDF_BYTES, mimeType: 'image/png' } })

        const resolved = await resolveAiFiles({ ctx, data: jobData([{ fileId: 'file-1' }]) })

        expect(resolved[0].mimeType).toBe('image/png')
    })

    it('falls back to an unknown type rather than guessing, so a file of no known kind is skipped downstream', async () => {
        const ctx = contextReading({ 'file-1': { data: PDF_BYTES } })

        const resolved = await resolveAiFiles({ ctx, data: jobData([{ fileId: 'file-1' }]) })

        expect(resolved[0].mimeType).toBe('application/octet-stream')
    })

    it('keeps the stored file name when the caller did not name the file', async () => {
        const ctx = contextReading({ 'file-1': { data: PDF_BYTES, mimeType: 'application/pdf', fileName: 'invoice.pdf' } })

        const resolved = await resolveAiFiles({ ctx, data: jobData([{ fileId: 'file-1' }]) })

        expect(resolved[0].filename).toBe('invoice.pdf')
    })

    it('resolves several files in order, so a multi-file extract keeps its inputs aligned', async () => {
        const ctx = contextReading({
            'file-1': { data: Buffer.from('one'), mimeType: 'application/pdf' },
            'file-2': { data: Buffer.from('two'), mimeType: 'image/png' },
            'file-3': { data: Buffer.from('three'), mimeType: 'application/pdf' },
        })

        const resolved = await resolveAiFiles({
            ctx,
            data: jobData([{ fileId: 'file-1' }, { fileId: 'file-2' }, { fileId: 'file-3' }]),
        })

        expect(resolved.map((file) => file.base64)).toEqual([
            Buffer.from('one').toString('base64'),
            Buffer.from('two').toString('base64'),
            Buffer.from('three').toString('base64'),
        ])
    })

    it('resolves to nothing when the step carries no files', async () => {
        const ctx = contextReading({})

        expect(await resolveAiFiles({ ctx, data: jobData(undefined) })).toEqual([])
    })
})
