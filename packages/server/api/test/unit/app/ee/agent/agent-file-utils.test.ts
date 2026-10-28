import { ModelMessage } from 'ai'
import { describe, expect, it } from 'vitest'
import { buildUserContentWithFiles, dropImagesForTextOnlyModels } from '../../../../../src/app/ee/agent/agent-file-utils'

describe('dropImagesForTextOnlyModels', () => {
    const imageTurn = async (): Promise<ModelMessage[]> => [
        { role: 'user', content: await buildUserContentWithFiles({ text: 'what is in this screenshot?', files: [{ name: 'shot.png', mimeType: 'image/png', data: 'aGVsbG8=' }] }) },
        { role: 'assistant', content: 'A login page.' },
    ]

    it('replaces the image with a note when the model cannot read images, so the provider does not 404 the turn', async () => {
        const messages = dropImagesForTextOnlyModels({ messages: await imageTurn(), models: [{ supportsVision: false }, { supportsVision: true }] })

        expect(messages[0].content).toEqual([
            { type: 'text', text: 'what is in this screenshot?' },
            { type: 'text', text: expect.stringContaining('cannot read images') },
        ])
        expect(messages[1]).toEqual({ role: 'assistant', content: 'A login page.' })
    })

    it('keeps the image for vision models and for models the catalog does not know', async () => {
        const original = await imageTurn()

        expect(dropImagesForTextOnlyModels({ messages: original, models: [{ supportsVision: true }, undefined] })).toEqual(original)
    })
})
