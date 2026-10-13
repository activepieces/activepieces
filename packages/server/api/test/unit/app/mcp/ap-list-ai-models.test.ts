import { AIProviderName } from '@activepieces/core-utils'
import { AIProviderModelType, McpToolResult, ProjectScopedMcpServer } from '@activepieces/shared'
import { describe, expect, it, vi } from 'vitest'

const listForProject = vi.fn()
const listModels = vi.fn()

vi.mock('../../../../src/app/ai/ai-provider-service', () => ({
    aiProviderService: () => ({ listForProject, listModels }),
}))

vi.mock('@activepieces/server-utils', async (importOriginal) => ({
    ...(await importOriginal<Record<string, unknown>>()),
    modelTierCatalog: (await import('../ee/agent/model-tier-fixture')).publishedModelTierCatalog,
}))

import { system } from '../../../../src/app/helper/system/system'
import { apListAiModelsTool } from '../../../../src/app/mcp/tools/ap-list-ai-models'

const log = system.globalLogger()
const mockMcp = { id: 'mcp-1', projectId: 'project-1', platformId: 'platform-1', tools: [], flows: [] } as unknown as ProjectScopedMcpServer

function textModel(id: string): { id: string, name: string, type: AIProviderModelType } {
    return { id, name: id, type: AIProviderModelType.TEXT }
}

function textOf(result: McpToolResult): string {
    return result.content.map((part) => part.text).join('\n')
}

describe('ap_list_ai_models', () => {
    it('offers a Run Agent step on Activepieces credits only the models it can call', async () => {
        listForProject.mockResolvedValue([{ provider: AIProviderName.ACTIVEPIECES, name: 'Activepieces' }])
        listModels.mockResolvedValue([textModel('mistralai/mistral-large'), textModel('openai/gpt-4o'), textModel('anthropic/claude-sonnet-4.6'), textModel('anthropic/claude-fable-5.1')])

        const text = textOf(await apListAiModelsTool(mockMcp, log).execute({}))

        expect(text).toContain('(id: anthropic/claude-sonnet-4.6)')
        expect(text).toContain('(id: anthropic/claude-fable-5.1)')
        expect(text).not.toContain('openai/gpt-4o')
    })

    it('leaves a bring-your-own key free to offer every text model it serves', async () => {
        listForProject.mockResolvedValue([{ provider: AIProviderName.OPENROUTER, name: 'OpenRouter' }])
        listModels.mockResolvedValue([textModel('mistralai/mistral-large'), textModel('openai/gpt-4o')])

        const text = textOf(await apListAiModelsTool(mockMcp, log).execute({}))

        expect(text).toContain('(id: mistralai/mistral-large)')
        expect(text).toContain('(id: openai/gpt-4o)')
    })
})
