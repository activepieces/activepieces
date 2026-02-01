import { createAnthropic } from '@ai-sdk/anthropic'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { createOpenAI } from '@ai-sdk/openai'
import { createOpenAICompatible } from '@ai-sdk/openai-compatible'
import { createAzure } from '@ai-sdk/azure'
import { AgentOutputField, AgentOutputFieldType, AIProviderName, AzureProviderConfig, CloudflareGatewayProviderConfig, GetProviderConfigResponse, OpenAICompatibleProviderConfig } from '@activepieces/shared'
import { createOpenRouter } from '@openrouter/ai-sdk-provider'
import { ApAxiosClient } from '../api/ap-axios'
import { workerMachine } from '../utils/machine'
import { LanguageModel } from 'ai'
import { PiecePropertyMap } from '@activepieces/pieces-framework'
import z, { ZodObject } from 'zod'

const removeTrailingSlash = (url: string): string => {
    return url.endsWith('/') ? url.slice(0, -1) : url
}

type GetModelParams = {
    provider: AIProviderName
    modelId: string
    engineToken: string
}

export const agentUtils = {
    async getModel({ provider, modelId, engineToken }: GetModelParams): Promise<LanguageModel> {
        const client = new ApAxiosClient(
            removeTrailingSlash(workerMachine.getInternalApiUrl()),
            engineToken,
        )
        const { config, auth } = await client.get<GetProviderConfigResponse>(
            `/v1/ai-providers/${provider}/config`,
            {},
        )

        switch (provider) {
            case AIProviderName.OPENAI: {
                const openaiProvider = createOpenAI({ apiKey: auth.apiKey })
                return openaiProvider.chat(modelId)
            }
            case AIProviderName.ANTHROPIC: {
                const anthropicProvider = createAnthropic({ apiKey: auth.apiKey })
                return anthropicProvider(modelId)
            }
            case AIProviderName.GOOGLE: {
                const googleProvider = createGoogleGenerativeAI({ apiKey: auth.apiKey })
                return googleProvider(modelId)
            }
            case AIProviderName.AZURE: {
                const { resourceName } = config as AzureProviderConfig
                const azureProvider = createAzure({ resourceName, apiKey: auth.apiKey })
                return azureProvider.chat(modelId)
            }
            case AIProviderName.CLOUDFLARE_GATEWAY: {
                const { accountId, gatewayId } = config as CloudflareGatewayProviderConfig
                const cloudflareProvider = createOpenAICompatible({
                    name: 'cloudflare',
                    baseURL: `https://gateway.ai.cloudflare.com/v1/${accountId}/${gatewayId}/compat`,
                    headers: {
                        'cf-aig-authorization': `Bearer ${auth.apiKey}`,
                    },
                })
                return cloudflareProvider.chatModel(modelId)
            }
            case AIProviderName.CUSTOM: {
                const { apiKeyHeader, baseUrl } = config as OpenAICompatibleProviderConfig
                const customProvider = createOpenAICompatible({
                    name: 'openai-compatible',
                    baseURL: baseUrl,
                    headers: {
                        [apiKeyHeader]: auth.apiKey,
                    },
                })
                return customProvider.chatModel(modelId)
            }
            case AIProviderName.ACTIVEPIECES:
            case AIProviderName.OPENROUTER: {
                const openrouterProvider = createOpenRouter({ apiKey: auth.apiKey })
                return openrouterProvider.chat(modelId) as LanguageModel
            }
            default:
                throw new Error(`Provider ${provider} is not supported`)
        }
    },

    sortPropertiesByDependencies(properties: PiecePropertyMap): Record<number, string[]> {
        const inDegree: Record<string, number> = {}
        const graph: Record<string, string[]> = {}
        const depth: Record<string, number> = {}

        Object.entries(properties).forEach(([key, property]) => {
            const hasRefreshers = 'refreshers' in property && property.refreshers && Array.isArray(property.refreshers) && property.refreshers.length > 0
            if (hasRefreshers) {
                for (const refresher of property.refreshers) {
                    if (typeof properties[refresher] === 'undefined' || properties[refresher] === null) {
                        continue
                    }
                    inDegree[key] = (inDegree[key] || 0) + 1
                    graph[refresher] = graph[refresher] ?? []
                    graph[refresher].push(key)
                }
            }
            inDegree[key] = inDegree[key] ?? 0
            graph[key] = graph[key] ?? []
        })

        // Topological sort
        const order: string[] = []
        const queue = Object.entries(inDegree)
            .filter(([, degree]) => degree === 0)
            .map(([name]) => name)

        queue.forEach(property => depth[property] = 0)

        while (queue.length > 0) {
            const current = queue.shift()!
            order.push(current)

            const neighbors = graph[current] || []
            neighbors.forEach(neighbor => {
                inDegree[neighbor]--
                if (inDegree[neighbor] === 0) {
                    queue.push(neighbor)
                    depth[neighbor] = depth[current] + 1
                }
            })
        }

        const depthToPropertyMap: Record<number, string[]> = {}
        for (const [property, depthValue] of Object.entries(depth)) {
            depthToPropertyMap[depthValue] = depthToPropertyMap[depthValue] ?? []
            depthToPropertyMap[depthValue].push(property)
        }

        return depthToPropertyMap
    },

    structuredOutputSchema(outputFields: AgentOutputField[]): ZodObject | undefined {
        const shape: Record<string, z.ZodType> = {};
    
        for (const field of outputFields) {
          switch (field.type) {
            case AgentOutputFieldType.TEXT:
              shape[field.displayName] = z.string();
              break;
            case AgentOutputFieldType.NUMBER:
              shape[field.displayName] = z.number();
              break;
            case AgentOutputFieldType.BOOLEAN:
              shape[field.displayName] = z.boolean();
              break;
            default:
              shape[field.displayName] = z.any();
          }
        }
        return Object.keys(shape).length > 0 ? z.object(shape) : undefined;
      },
}

