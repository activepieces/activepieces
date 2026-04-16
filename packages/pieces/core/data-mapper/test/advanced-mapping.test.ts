/// <reference types="vitest/globals" />

import { createMockActionContext } from '@activepieces/pieces-framework'
import { advancedMapping } from '../src/lib/actions/advanced-mapping'

describe('advancedMapping', () => {
    test('returns simple object mapping as-is', async () => {
        const ctx = createMockActionContext({
            propsValue: {
                mapping: { key: 'value' },
            },
        })
        const result = await advancedMapping.run(ctx)
        expect(result).toEqual({ key: 'value' })
    })
})
