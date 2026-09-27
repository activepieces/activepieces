import { SaveAgentFileResponse } from '@activepieces/shared'
import { ToolExecutionOptions } from 'ai'
import { describe, expect, it, vi } from 'vitest'
import { createImageTools } from '../../../../../../src/lib/execute/jobs/ee/agent/tools/web-media-tools'

describe('ap_generate_image', () => {
    it('stores the image, shows its card and returns the file', async () => {
        const saveFile = vi.fn(async (): Promise<SaveAgentFileResponse> => SAVED)
        const emitImage = vi.fn()

        const result = await runImageTool({ generate: async () => GENERATED, billedAtCost: false, saveFile, emitImage })

        expect(saveFile).toHaveBeenCalledWith({ data: GENERATED.bytes, mediaType: 'image/png', fileName: 'generated-call-1.png' })
        expect(emitImage).toHaveBeenCalledWith(expect.objectContaining({ fileId: SAVED.fileId, model: GENERATED.model, caption: 'Launch banner' }))
        expect(result).toEqual({ success: true, fileId: SAVED.fileId, url: SAVED.url, mediaType: 'image/png', model: GENERATED.model, prompt: 'a banner' })
    })

    it('marks an image made on the managed key as already billed at cost', async () => {
        const result = await runImageTool({ generate: async () => GENERATED, billedAtCost: true, saveFile: async () => SAVED, emitImage: vi.fn() })

        expect(result).toMatchObject({ success: true, billedAtCost: true })
    })

    it('reports a failed generation without storing anything, keeping the mark', async () => {
        const saveFile = vi.fn(async (): Promise<SaveAgentFileResponse> => SAVED)

        const result = await runImageTool({ generate: async () => { throw new Error('model unavailable') }, billedAtCost: true, saveFile, emitImage: vi.fn() })

        expect(saveFile).not.toHaveBeenCalled()
        expect(result).toEqual({ content: [{ type: 'text', text: 'Image generation failed: model unavailable' }], billedAtCost: true })
    })
})

async function runImageTool(params: Parameters<typeof createImageTools>[0]): Promise<unknown> {
    const execute = createImageTools(params).ap_generate_image.execute
    if (!execute) {
        throw new Error('ap_generate_image has no execute')
    }
    return execute({ prompt: 'a banner', style: 'graphic_text', caption: 'Launch banner' }, EXECUTION_OPTIONS)
}

const GENERATED = { bytes: Buffer.from('png'), mediaType: 'image/png', extension: 'png', model: 'google/gemini-3.1-flash-lite-image' }

const SAVED: SaveAgentFileResponse = { fileId: 'file-1', url: 'https://files.example/file-1' }

const EXECUTION_OPTIONS: ToolExecutionOptions = { toolCallId: 'call-1', messages: [] }
