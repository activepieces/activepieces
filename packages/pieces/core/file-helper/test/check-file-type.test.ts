/// <reference types="vitest/globals" />

import { ApFile, createMockActionContext } from '@activepieces/pieces-framework'
import { checkFileType } from '../src/lib/actions/check-file-type'

describe('checkFileType', () => {
    test('matches correct MIME type', async () => {
        const file = new ApFile('photo.png', Buffer.from('fake-png'), 'png')
        const ctx = createMockActionContext({
            propsValue: {
                file,
                mimeTypes: ['image/png', 'image/jpeg'],
            },
        })
        const result = await checkFileType.run(ctx)
        expect(result).toEqual({
            mimeType: 'image/png',
            isMatch: true,
        })
    })

    test('does not match incorrect MIME type', async () => {
        const file = new ApFile('doc.pdf', Buffer.from('fake-pdf'), 'pdf')
        const ctx = createMockActionContext({
            propsValue: {
                file,
                mimeTypes: ['image/png', 'image/jpeg'],
            },
        })
        const result = await checkFileType.run(ctx)
        expect(result).toHaveProperty('isMatch', false)
    })
})
