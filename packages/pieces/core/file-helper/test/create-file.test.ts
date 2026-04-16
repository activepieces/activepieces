/// <reference types="vitest/globals" />

import { createMockActionContext } from '@activepieces/pieces-framework'
import { createFile } from '../src/lib/actions/create-file'

describe('createFile', () => {
    test('creates file with utf8 encoding', async () => {
        const ctx = createMockActionContext({
            propsValue: {
                content: 'Hello, World!',
                fileName: 'test.txt',
                encoding: 'utf8',
            },
        })
        const result = await createFile.run(ctx)
        expect(result).toEqual({
            fileName: 'test.txt',
            url: 'test-file-url',
        })
    })
})
