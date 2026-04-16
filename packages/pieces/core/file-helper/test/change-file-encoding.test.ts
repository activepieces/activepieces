/// <reference types="vitest/globals" />

import { ApFile, createMockActionContext } from '@activepieces/pieces-framework'
import { changeFileEncoding } from '../src/lib/actions/change-file-encoding'

describe('changeFileEncoding', () => {
    test('changes encoding from utf8 to base64', async () => {
        const file = new ApFile('input.txt', Buffer.from('Hello, World!', 'utf8'), 'txt')
        const ctx = createMockActionContext({
            propsValue: {
                inputFile: file,
                inputEncoding: 'utf8',
                outputFileName: 'output.txt',
                outputEncoding: 'base64',
            },
        })
        const result = await changeFileEncoding.run(ctx)
        expect(result).toBe('test-file-url')
    })
})
