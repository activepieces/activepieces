import { afterEach, describe, expect, it, vi } from 'vitest'

import { communityTemplates } from '../../../../src/app/template/community-templates.service'

describe('communityTemplates', () => {
    afterEach(() => {
        vi.unstubAllGlobals()
    })

    it('prepends curated n8n templates on first page', async () => {
        mockTemplatesResponse({
            data: [
                {
                    id: 'cloud-template',
                },
            ],
            next: 'next-page',
            previous: null,
        })

        const result = await communityTemplates.list({})

        expect(result.data[0].id).toBe('n8n-typeform-hubspot-slack-leads')
        expect(result.data.at(-1)?.id).toBe('cloud-template')
        expect(result.next).toBe('next-page')
        expect(result.previous).toBeNull()
    })

    it('does not repeat curated n8n templates on cursor pages', async () => {
        mockTemplatesResponse({
            data: [
                {
                    id: 'cloud-template-page-two',
                },
            ],
            next: null,
            previous: 'previous-page',
        })

        const request = {
            search: 'cloud',
            cursor: 'next-page',
        }

        const result = await communityTemplates.list(request)

        expect(result.data).toEqual([
            {
                id: 'cloud-template-page-two',
            },
        ])
        expect(result.next).toBeNull()
        expect(result.previous).toBe('previous-page')
    })
})

function mockTemplatesResponse(response: MockTemplatesResponse): void {
    vi.stubGlobal(
        'fetch',
        vi.fn(async () => ({
            ok: true,
            json: async () => response,
        })),
    )
}

type MockTemplatesResponse = {
    data: { id: string }[]
    next: string | null
    previous: string | null
}
