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

    it('edits an image in the conversation by passing it to the generator', async () => {
        const generate = vi.fn(async () => GENERATED)
        const readImage = vi.fn(async () => SOURCE)

        await runImageTool({ generate, billedAtCost: false, readImage, saveFile: async () => SAVED, emitImage: vi.fn() }, { editFileId: 'file-0' })

        expect(readImage).toHaveBeenCalledWith('file-0')
        expect(generate).toHaveBeenCalledWith(expect.objectContaining({ inputImages: [SOURCE] }))
    })

    it('lists the images it can edit when the fileId is wrong, so the model can retry', async () => {
        const result = await runImageTool({
            generate: async () => GENERATED,
            billedAtCost: false,
            readImage: missingImage,
            conversationImages: [{ fileId: 'file-real', description: 'A red bicycle' }],
            saveFile: async () => SAVED,
            emitImage: vi.fn(),
        }, { editFileId: 'file-made-up' })

        expect(result).toEqual({ content: [{ type: 'text', text: 'Image editing failed: no image with fileId file-made-up in this conversation. Images you can edit: file-real (A red bicycle).' }] })
    })

    it('lists only the latest images in the schema, and the latest hundred when the fileId is wrong', async () => {
        const conversationImages = Array.from({ length: 102 }, (_, index) => ({ fileId: `file-${index}`, description: 'x'.repeat(500) }))
        const params = {
            generate: async () => GENERATED,
            billedAtCost: false,
            readImage: missingImage,
            conversationImages,
            saveFile: async () => SAVED,
            emitImage: vi.fn(),
        }

        const schema = createImageTools(params).ap_generate_image.inputSchema.shape.editFileId.description
        const result = JSON.stringify(await runImageTool(params, { editFileId: 'file-made-up' }))

        expect(schema).not.toContain('file-91 ')
        expect(schema).toContain('file-92 ')
        expect(schema).toContain('92 older images')
        expect(result).not.toContain('file-1 ')
        expect(result).toContain('file-2 ')
        expect(result).toContain('file-101 ')
        expect(result).not.toContain('x'.repeat(121))
    })

    it('refuses to edit a file that is not an image', async () => {
        const generate = vi.fn(async () => GENERATED)

        const result = await runImageTool({ generate, billedAtCost: false, readImage: async () => ({ ...SOURCE, mimeType: 'application/pdf' }), saveFile: async () => SAVED, emitImage: vi.fn() }, { editFileId: 'file-0' })

        expect(generate).not.toHaveBeenCalled()
        expect(result).toEqual({ content: [{ type: 'text', text: 'Image editing failed: file file-0 is not an image.' }] })
    })

    it('refuses an edit when the image service can only create new images', async () => {
        const generate = vi.fn(async () => GENERATED)

        const result = await runImageTool({ generate, billedAtCost: false, saveFile: async () => SAVED, emitImage: vi.fn() }, { editFileId: 'file-0' })

        expect(generate).not.toHaveBeenCalled()
        expect(result).toMatchObject({ content: [{ type: 'text' }] })
    })

    it('reports a failed generation without storing anything, keeping the mark', async () => {
        const saveFile = vi.fn(async (): Promise<SaveAgentFileResponse> => SAVED)

        const result = await runImageTool({ generate: unavailableModel, billedAtCost: true, saveFile, emitImage: vi.fn() })

        expect(saveFile).not.toHaveBeenCalled()
        expect(result).toEqual({ content: [{ type: 'text', text: 'Image generation failed: model unavailable' }], billedAtCost: true })
    })
})

async function runImageTool(params: Parameters<typeof createImageTools>[0], input: { editFileId?: string } = {}): Promise<unknown> {
    const execute = createImageTools(params).ap_generate_image.execute
    if (!execute) {
        throw new Error('ap_generate_image has no execute')
    }
    return execute({ prompt: 'a banner', style: 'graphic_text', caption: 'Launch banner', ...input }, EXECUTION_OPTIONS)
}

async function missingImage(): Promise<never> {
    throw new Error('ENTITY_NOT_FOUND')
}

async function unavailableModel(): Promise<never> {
    throw new Error('model unavailable')
}

const GENERATED = { bytes: Buffer.from('png'), mediaType: 'image/png', extension: 'png', model: 'google/gemini-3.1-flash-lite-image' }

const SOURCE = { mimeType: 'image/png', base64: Buffer.from('source').toString('base64') }

const SAVED: SaveAgentFileResponse = { fileId: 'file-1', url: 'https://files.example/file-1' }

const EXECUTION_OPTIONS: ToolExecutionOptions = { toolCallId: 'call-1', messages: [] }
