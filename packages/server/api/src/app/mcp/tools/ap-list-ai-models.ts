import { AIProviderModelType, AIProviderName, McpServer, McpToolDefinition } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { z } from 'zod'
import { aiProviderService } from '../../ai/ai-provider-service'
import { projectService } from '../../project/project-service'
import { mcpToolError } from './mcp-utils'

const providerSchema = z.enum(Object.values(AIProviderName) as [AIProviderName, ...AIProviderName[]])

const listAiModelsInput = z.object({
    provider: providerSchema.optional().describe('Filter by provider name. Omit to list all configured providers and their models.'),
})

export const apListAiModelsTool = (mcp: McpServer, log: FastifyBaseLogger): McpToolDefinition => {
    return {
        title: 'ap_list_ai_models',
        description: 'List configured AI providers and their available models. Use this to discover valid provider and model values for configuring Run Agent steps. The output shows provider names and model IDs needed for the aiProviderModel input.',
        inputSchema: listAiModelsInput.shape,
        annotations: { readOnlyHint: true, openWorldHint: true },
        execute: async (args) => {
            try {
                const { provider: filterProvider } = listAiModelsInput.parse(args)

                const project = await projectService(log).getOneOrThrow(mcp.projectId)
                const service = aiProviderService(log)
                const providers = await service.listProviders(project.platformId)

                if (providers.length === 0) {
                    return { content: [{ type: 'text', text: 'No AI providers configured. Ask a platform admin to add one in Settings → AI Providers.' }] }
                }

                const filteredProviders = filterProvider
                    ? providers.filter(p => p.provider === filterProvider)
                    : providers

                if (filteredProviders.length === 0) {
                    const available = providers.map(p => p.provider).join(', ')
                    return { content: [{ type: 'text', text: `Provider "${filterProvider}" is not configured. Available providers: ${available}` }] }
                }

                const MAX_MODELS_PER_PROVIDER = 20
                const sections = await Promise.all(
                    filteredProviders.map(async (p) => {
                        try {
                            const models = await service.listModels(project.platformId, p.provider)
                            const textModels = models.filter(m => m.type === AIProviderModelType.TEXT)
                            const capped = textModels.slice(0, MAX_MODELS_PER_PROVIDER)
                            const modelLines = capped.length > 0
                                ? capped.map(m => `    - ${m.name} (id: ${m.id})`).join('\n')
                                : '    (no text models available)'
                            const overflow = textModels.length > MAX_MODELS_PER_PROVIDER
                                ? `\n    ... and ${textModels.length - MAX_MODELS_PER_PROVIDER} more${filterProvider ? '' : ` (use provider="${p.provider}" to see all)`}`
                                : ''
                            return `- ${p.provider} (${p.name}) — ${textModels.length} text model(s)\n  Models:\n${modelLines}${overflow}`
                        }
                        catch (err) {
                            log.warn({ err, provider: p.provider }, 'ap_list_ai_models: failed to fetch models for provider')
                            return `- ${p.provider} (${p.name})\n  (failed to fetch models)`
                        }
                    }),
                )

                return {
                    content: [{
                        type: 'text',
                        text: `Configured AI Providers:\n\n${sections.join('\n\n')}\n\nUsage: Set aiProviderModel to {"provider": "<provider>", "model": "<model id>"} when configuring a Run Agent step.`,
                    }],
                }
            }
            catch (err) {
                log.error({ err, projectId: mcp.projectId }, 'ap_list_ai_models failed')
                return mcpToolError('Failed to list AI models', err)
            }
        },
    }
}
