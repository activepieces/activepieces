import { McpToolResult, ProjectScopedMcpServer } from '@activepieces/shared'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockSearchActions = vi.fn()
const mockSearchTriggers = vi.fn()

vi.mock('../../../../src/app/tool-search/tool-search.service', () => ({
    toolSearchService: vi.fn(() => ({
        searchActions: mockSearchActions,
        searchTriggers: mockSearchTriggers,
    })),
}))

import { system } from '../../../../src/app/helper/system/system'
import { apSearchActionsTool } from '../../../../src/app/mcp/tools/ap-search-actions'
import { apSearchTriggersTool } from '../../../../src/app/mcp/tools/ap-search-triggers'

const log = system.globalLogger()
// platformId is set so resolvePlatformId short-circuits without a DB/project lookup.
const mockMcp = { id: 'mcp-1', projectId: 'project-1', platformId: 'platform-1', tools: [], flows: [] } as unknown as ProjectScopedMcpServer

function textOf(result: McpToolResult): string {
    return result.content.map((part) => part.text).join('\n')
}

describe('ap_search_actions / ap_search_triggers — empty-query validation (no doomed embed call)', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it.each(['', '   ', '\t\n'])('rejects a whitespace-only actions query (%j) at validation, never reaching the search service', async (query) => {
        const result = await apSearchActionsTool(mockMcp, log).execute({ query })

        expect(result.isError).toBe(true)
        expect(textOf(result).toLowerCase()).toContain('non-empty')
        // The service — and therefore any OpenAI embed call — is never invoked for an empty query.
        expect(mockSearchActions).not.toHaveBeenCalled()
    })

    it.each(['', '   ', '\t\n'])('rejects a whitespace-only triggers query (%j) at validation, never reaching the search service', async (query) => {
        const result = await apSearchTriggersTool(mockMcp, log).execute({ query })

        expect(result.isError).toBe(true)
        expect(textOf(result).toLowerCase()).toContain('non-empty')
        expect(mockSearchTriggers).not.toHaveBeenCalled()
    })

    it('lets a real (trimmed) query through to the search service — the schema does not over-reject', async () => {
        mockSearchActions.mockResolvedValue({ results: [], mode: 'semantic' })

        await apSearchActionsTool(mockMcp, log).execute({ query: '  send a slack message  ' })

        expect(mockSearchActions).toHaveBeenCalledTimes(1)
        expect(mockSearchActions.mock.calls[0][0]).toBe('send a slack message')
    })
})

describe('ap_search_actions — the keyword-degrade note names the real cause', () => {
    const row = {
        pieceName: '@activepieces/piece-slack',
        actionName: 'send_channel_message',
        displayName: 'Send Channel Message',
        oneLineDescription: 'Send a message to a Slack channel',
        requiresConnection: true,
    }

    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('reports "no embedding model configured" when no model is configured', async () => {
        mockSearchActions.mockResolvedValue({ results: [row], mode: 'keyword', degradeReason: 'no-embedder' })

        const text = textOf(await apSearchActionsTool(mockMcp, log).execute({ query: 'send a message' }))

        expect(text).toContain('no embedding model configured')
        expect(text).not.toContain('the embedding service call failed')
    })

    it('reports "the embedding service call failed" when a configured model errored', async () => {
        mockSearchActions.mockResolvedValue({ results: [row], mode: 'keyword', degradeReason: 'embed-failed' })

        const text = textOf(await apSearchActionsTool(mockMcp, log).execute({ query: 'send a message' }))

        expect(text).toContain('the embedding service call failed')
        expect(text).not.toContain('no embedding model configured')
    })
})
