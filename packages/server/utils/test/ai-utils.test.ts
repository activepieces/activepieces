import { ActivepiecesAiBilling, ActivepiecesAiConsumerSource, ActivepiecesAiCostEvent, AIProviderName } from '@activepieces/core-utils'
import { ACTIVEPIECES_CHAT_TIERS, ACTIVEPIECES_IMAGE_TIERS, aiProviderCredentials } from '@activepieces/shared'
import { generateText, jsonSchema, tool } from 'ai'
import { describe, expect, it } from 'vitest'
import { activepiecesAiCost } from '../src/activepieces-ai-cost'
import { aiUtils, WebSearchOptions } from '../src/ai-utils'

function anthropicSearchArgs(options: WebSearchOptions): Record<string, unknown> {
    const tools = aiUtils.buildWebSearchTools({ provider: AIProviderName.ANTHROPIC, options })
    return toArgs(tools['web_search'])
}

function toArgs(tool: unknown): Record<string, unknown> {
    const args = (tool as { args?: Record<string, unknown> } | undefined)?.args
    return args ?? {}
}

describe('aiUtils.buildWebSearchTools', () => {
    it('defaults to five uses when the caller passes no options, as the agent does', () => {
        const tools = aiUtils.buildWebSearchTools({ provider: AIProviderName.ANTHROPIC })
        expect(toArgs(tools['web_search'])).toEqual({ maxUses: 5 })
    })

    it('drops blocked domains when allowed domains are present, rather than sending both', () => {
        expect(anthropicSearchArgs({
            allowedDomains: [{ domain: 'docs.example.com' }],
            blockedDomains: [{ domain: 'spam.example.com' }],
        })).toEqual({ maxUses: 5, allowedDomains: ['docs.example.com'] })
    })

    it('sends blocked domains when no allowed domains narrow the search', () => {
        expect(anthropicSearchArgs({ blockedDomains: [{ domain: 'spam.example.com' }] }))
            .toEqual({ maxUses: 5, blockedDomains: ['spam.example.com'] })
    })

    it('treats an empty domain list as absent', () => {
        expect(anthropicSearchArgs({ allowedDomains: [], blockedDomains: [{ domain: 'spam.example.com' }] }))
            .toEqual({ maxUses: 5, blockedDomains: ['spam.example.com'] })
    })

    it('builds a partial user location from whichever fields were filled in', () => {
        expect(anthropicSearchArgs({ userLocationCity: 'Amman', userLocationTimezone: 'Asia/Amman' }))
            .toEqual({ maxUses: 5, userLocation: { type: 'approximate', city: 'Amman', timezone: 'Asia/Amman' } })
    })

    it('omits the user location entirely when no location field was filled in', () => {
        expect(anthropicSearchArgs({ maxUses: 2 })).toEqual({ maxUses: 2 })
    })

    it('gives OpenAI the Responses-API preview tool with its own options', () => {
        const tools = aiUtils.buildWebSearchTools({
            provider: AIProviderName.OPENAI,
            options: { searchContextSize: 'high', userLocationCountry: 'JO' },
        })
        expect(toArgs(tools['web_search_preview']))
            .toEqual({ searchContextSize: 'high', userLocation: { type: 'approximate', country: 'JO' } })
    })

    it('follows a Cloudflare Gateway model to the provider that actually serves it', () => {
        const tools = aiUtils.buildWebSearchTools({
            provider: AIProviderName.CLOUDFLARE_GATEWAY,
            model: 'anthropic/claude-sonnet-4-6',
            options: { maxUses: 3 },
        })
        expect(toArgs(tools['web_search'])).toEqual({ maxUses: 3 })
    })

    it('returns no tools for a Cloudflare Gateway model whose submodel has no native web search', () => {
        expect(aiUtils.buildWebSearchTools({
            provider: AIProviderName.CLOUDFLARE_GATEWAY,
            model: 'mistral/mistral-large',
        })).toEqual({})
    })

    it('returns no tools for a provider that has no native web search', () => {
        expect(aiUtils.buildWebSearchTools({ provider: AIProviderName.MISTRAL })).toEqual({})
    })

    it('returns no tools for a key-less provider, which can never reach a native search tool', () => {
        expect(aiUtils.buildWebSearchTools({ provider: AIProviderName.VERTEX })).toEqual({})
        expect(aiUtils.buildWebSearchTools({ provider: AIProviderName.BEDROCK })).toEqual({})
    })
})

describe('aiUtils.buildWebSearchToolsOrThrow', () => {
    it('fails the way the piece does when the provider has no web search', () => {
        expect(() => aiUtils.buildWebSearchToolsOrThrow({ provider: AIProviderName.AZURE, webSearchEnabled: true }))
            .toThrow('Provider azure is not supported for web search')
    })

    it('fails on a Cloudflare Gateway model whose submodel has no web search, naming the gateway as the piece does', () => {
        expect(() => aiUtils.buildWebSearchToolsOrThrow({
            provider: AIProviderName.CLOUDFLARE_GATEWAY,
            model: 'mistral/mistral-large',
            webSearchEnabled: true,
        })).toThrow('Provider cloudflare-gateway is not supported for web search')
    })

    it('returns no tools without throwing for a plugin provider, which searches through the model instead', () => {
        expect(aiUtils.buildWebSearchToolsOrThrow({ provider: AIProviderName.ACTIVEPIECES, webSearchEnabled: true })).toEqual({})
        expect(aiUtils.buildWebSearchToolsOrThrow({ provider: AIProviderName.OPENROUTER, webSearchEnabled: true })).toEqual({})
    })

    it('builds the same tool as the total variant when the provider is supported', () => {
        const strict = aiUtils.buildWebSearchToolsOrThrow({
            provider: AIProviderName.CLOUDFLARE_GATEWAY,
            model: 'anthropic/claude-sonnet-4-6',
            webSearchEnabled: true,
            options: { maxUses: 3 },
        })
        expect(toArgs(strict['web_search'])).toEqual({ maxUses: 3 })
    })

    it('stays silent for an unsupported provider when web search is switched off', () => {
        expect(aiUtils.buildWebSearchToolsOrThrow({ provider: AIProviderName.AZURE, webSearchEnabled: false })).toEqual({})
    })
})

describe('aiUtils.createModelForImages', () => {
    const gatewayConfig = { accountId: 'account', gatewayId: 'gateway' }

    it('builds an image model for a Cloudflare Gateway model, as the piece does', () => {
        const model = aiUtils.createModelForImages({
            credentials: aiProviderCredentials({ provider: AIProviderName.CLOUDFLARE_GATEWAY, auth: { apiKey: 'key' }, config: gatewayConfig }),
            modelId: 'openai/dall-e-3',
        })

        expect(model).toBeDefined()
    })

    it('builds an image model for a gateway submodel it has no dedicated branch for', () => {
        const model = aiUtils.createModelForImages({
            credentials: aiProviderCredentials({ provider: AIProviderName.CLOUDFLARE_GATEWAY, auth: { apiKey: 'key' }, config: gatewayConfig }),
            modelId: 'workers-ai/flux',
        })

        expect(model).toBeDefined()
    })

    it('returns nothing for a provider with no image model, so the caller can fall back to text', () => {
        expect(aiUtils.createModelForImages({
            credentials: aiProviderCredentials({ provider: AIProviderName.GOOGLE, auth: { apiKey: 'key' }, config: {} }),
            modelId: 'gemini-2.5-flash',
        })).toBeUndefined()
    })
})

describe('aiUtils.createModel on the managed Activepieces key', () => {
    const managed = aiProviderCredentials({ provider: AIProviderName.ACTIVEPIECES, auth: { apiKey: 'sk-managed' }, config: {} })

    it('refuses a model that no published tier or allow-list entry permits', () => {
        expect(() => aiUtils.createModel({ credentials: managed, modelId: 'perplexity/sonar-deep-research', billing: null }))
            .toThrow(/not available on Activepieces AI credits/)
    })

    it('runs a model the tiers permit', () => {
        expect(() => aiUtils.createModel({ credentials: managed, modelId: ACTIVEPIECES_CHAT_TIERS[0].modelId, billing: null })).not.toThrow()
    })

    it('refuses an image model outside the managed image tiers', () => {
        expect(() => aiUtils.createModelForImages({ credentials: managed, modelId: 'openai/gpt-5-image' }))
            .toThrow(/not available on Activepieces AI credits/)
        expect(() => aiUtils.createModel({ credentials: managed, modelId: 'openai/gpt-5-image', imageGeneration: true, billing: null }))
            .toThrow(/not available on Activepieces AI credits/)
    })

    it('runs the managed default image model and an image model the admin chose', () => {
        expect(() => aiUtils.createModelForImages({ credentials: managed, modelId: ACTIVEPIECES_IMAGE_TIERS[0].modelId })).not.toThrow()
        expect(() => aiUtils.createModelForImages({ credentials: managed, modelId: 'openai/gpt-5-image', adminChosenImageModelId: 'openai/gpt-5-image' })).not.toThrow()
    })

    it('leaves a customer-supplied OpenRouter key unrestricted', () => {
        const own = aiProviderCredentials({ provider: AIProviderName.OPENROUTER, auth: { apiKey: 'sk-own' }, config: {} })
        expect(() => aiUtils.createModel({ credentials: own, modelId: 'perplexity/sonar-deep-research', billing: null })).not.toThrow()
    })
})

describe('what the managed provider is asked to send back', () => {
    async function settingsFor({ provider, webSearchEnabled = false }: { provider: AIProviderName, webSearchEnabled?: boolean }): Promise<Record<string, unknown>> {
        const model = aiUtils.createModel({ credentials: aiProviderCredentials({ provider, auth: { apiKey: 'key' }, config: {} }), modelId: ACTIVEPIECES_CHAT_TIERS[0].modelId, webSearchEnabled, billing: null })
        return sentBody(() => generateText({ model, prompt: 'hi', maxRetries: 0 }))
    }

    it('asks OpenRouter to report what a managed call cost, which is the whole basis of the bill', async () => {
        expect(await settingsFor({ provider: AIProviderName.ACTIVEPIECES })).toMatchObject({ usage: { include: true } })
    })

    it('keeps asking for the cost when web search is on, rather than letting the plugin setting replace it', async () => {
        expect(await settingsFor({ provider: AIProviderName.ACTIVEPIECES, webSearchEnabled: true })).toMatchObject({
            usage: { include: true },
            plugins: [{ id: 'web', max_results: 5 }],
        })
    })

    it('asks a customer own OpenRouter key for its cost too, so AI usage shows what the provider charged', async () => {
        expect(await settingsFor({ provider: AIProviderName.OPENROUTER })).toMatchObject({ usage: { include: true } })
    })
})

describe('aiUtils.createModel tool choice', () => {
    it('asks the model to call a required tool instead of forcing tool_choice, which some models reject', async () => {
        const model = aiUtils.createModel({ credentials: aiProviderCredentials({ provider: AIProviderName.ANTHROPIC, auth: { apiKey: 'key' }, config: {} }), modelId: 'claude-opus-5-5', billing: null })
        const body = await sentBody(() => generateText({
            model,
            prompt: 'hi',
            maxRetries: 0,
            tools: { extractData: tool({ inputSchema: jsonSchema({ type: 'object', properties: {} }) }) },
            toolChoice: 'required',
        }))

        expect(body.tool_choice).toEqual({ type: 'auto' })
    })

    it('bills the dollar cost of every attempt when a managed model answers a required tool in text first', async () => {
        const reported: ActivepiecesAiCostEvent[] = []
        activepiecesAiCost.setReporter((event) => reported.push(event))
        const replies = [
            { id: 'gen-text', choices: [{ index: 0, message: { role: 'assistant', content: 'The total is 1250.' }, finish_reason: 'stop' }], usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15, cost: 0.003 } },
            { id: 'gen-tool', choices: [{ index: 0, message: { role: 'assistant', content: null, tool_calls: [{ id: 'call_1', type: 'function', function: { name: 'extractData', arguments: '{}' } }] }, finish_reason: 'tool_calls' }], usage: { prompt_tokens: 12, completion_tokens: 6, total_tokens: 18, cost: 0.004 } },
        ]
        const original = globalThis.fetch
        globalThis.fetch = () => Promise.resolve(new Response(JSON.stringify(replies.shift()), { headers: { 'content-type': 'application/json' } }))
        try {
            const model = aiUtils.createModel({ credentials: aiProviderCredentials({ provider: AIProviderName.OPENROUTER, auth: { apiKey: 'key' }, config: {} }), modelId: 'anthropic/claude-opus-5.5', billing: BILLING, usageOnly: true })
            await generateText({
                model,
                prompt: 'hi',
                maxRetries: 0,
                tools: { extractData: tool({ inputSchema: jsonSchema({ type: 'object', properties: {} }) }) },
                toolChoice: 'required',
            })
        }
        finally {
            globalThis.fetch = original
            activepiecesAiCost.setReporter(() => undefined)
        }

        expect(reported.map((event) => event.call?.observedCostUsd)).toEqual([0.003, 0.004])
    })
})

async function sentBody(send: () => Promise<unknown>): Promise<Record<string, unknown>> {
    const original = globalThis.fetch
    let body: Record<string, unknown> = {}
    globalThis.fetch = (_input, init) => {
        body = typeof init?.body === 'string' ? JSON.parse(init.body) : {}
        return Promise.resolve(new Response('{}'))
    }
    try {
        await send().catch(() => undefined)
    }
    finally {
        globalThis.fetch = original
    }
    return body
}

const BILLING: ActivepiecesAiBilling = {
    source: ActivepiecesAiConsumerSource.AI_STEP_IN_FLOW,
    platformId: 'platform-1',
    projectId: 'project-1',
    flowRun: { flowId: 'flow-1', flowRunId: 'run-1' },
}
