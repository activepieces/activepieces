import { aiProviderCredentials, AIProviderName } from '@activepieces/core-utils'
import { describe, expect, it, vi } from 'vitest'
import { createCloudflareGatewayModel } from './create-cloudflare-gateway-model'

type SentRequest = { url: string, headers: Headers, body: Record<string, unknown> }
type ModelIdentity = { provider: string, modelId: string, config?: { headers?: () => Record<string, string>, baseURL?: string | (() => string), url?: (options: { path: string }) => string } }

function identify(model: unknown): ModelIdentity {
    return model as ModelIdentity
}

async function sendHi(model: ReturnType<typeof createCloudflareGatewayModel>): Promise<SentRequest> {
    const original = globalThis.fetch
    let seen: SentRequest = { url: '', headers: new Headers(), body: {} }
    globalThis.fetch = (input, init) => {
        seen = { url: String(input), headers: new Headers(init?.headers), body: typeof init?.body === 'string' ? JSON.parse(init.body) : {} }
        return Promise.resolve(new Response('{}'))
    }
    try {
        await model.doGenerate({ prompt: [{ role: 'user', content: [{ type: 'text', text: 'hi' }] }] }).catch(() => undefined)
    }
    finally {
        globalThis.fetch = original
    }
    return seen
}

const credentials = aiProviderCredentials({ provider: AIProviderName.CLOUDFLARE_GATEWAY, auth: { apiKey: 'cf-key' }, config: { accountId: 'acct', gatewayId: 'gw' } })

describe('createCloudflareGatewayModel', () => {
    describe('compat routing', () => {
        it('strips the submodel prefix from the model id', () => {
            const model = identify(createCloudflareGatewayModel({ credentials, modelId: 'openai/gpt-4o' }))
            expect(model.modelId).toBe('gpt-4o')
        })

        it('sends the gateway authorization header and no metadata header', async () => {
            const request = await sendHi(createCloudflareGatewayModel({ credentials, modelId: 'openai/gpt-4o' }))
            expect(request.headers.get('cf-aig-authorization')).toBe('Bearer cf-key')
            expect(request.headers.has('cf-aig-metadata')).toBe(false)
        })

        it('sends an openai model to the gateway Responses endpoint without storing the conversation', async () => {
            const model = createCloudflareGatewayModel({ credentials, modelId: 'openai/gpt-5.6-sol' })
            const request = await sendHi(model)

            expect(identify(model).provider).toBe('openai.responses')
            expect(request.url).toBe('https://gateway.ai.cloudflare.com/v1/acct/gw/openai/responses')
            expect(request.body).toMatchObject({ model: 'gpt-5.6-sol', store: false })
            expect(request.headers.has('authorization')).toBe(false)
        })

        it('still reports the key outcome for an openai model', async () => {
            const onOutcome = vi.fn()
            await sendHi(createCloudflareGatewayModel({ credentials, modelId: 'openai/gpt-5.6-sol', onOutcome }))

            expect(onOutcome).toHaveBeenCalled()
        })

        it('ignores the submodel prefix and stays on the compat endpoint', () => {
            const model = identify(createCloudflareGatewayModel({ credentials, modelId: 'anthropic/claude-sonnet-4' }))
            expect(model.modelId).toBe('claude-sonnet-4')
            expect(model.provider).toContain('cloudflare')
        })
    })

    describe('submodel routing', () => {
        it('routes an openai submodel to the gateway openai endpoint with the stripped id', () => {
            const model = identify(createCloudflareGatewayModel({ credentials, modelId: 'openai/gpt-4o', routing: 'submodel' }))
            expect(model.modelId).toBe('gpt-4o')
            expect(model.provider).toBe('openai.responses')
        })

        it('falls back to the compat endpoint with the full model id for an unmapped prefix', () => {
            const model = identify(createCloudflareGatewayModel({ credentials, modelId: 'mystery/some-model', routing: 'submodel' }))
            expect(model.modelId).toBe('mystery/some-model')
            expect(model.provider).toContain('cloudflare')
        })

        it('falls back to compat when a vertex submodel has no vertex project configured', () => {
            const model = identify(createCloudflareGatewayModel({ credentials, modelId: 'google-vertex-ai/publishers/google/models/gemini-2.0', routing: 'submodel' }))
            expect(model.provider).toContain('cloudflare')
        })

        it('routes an anthropic submodel through the gateway wrapper', () => {
            const model = identify(createCloudflareGatewayModel({ credentials, modelId: 'anthropic/claude-sonnet-4', routing: 'submodel' }))
            expect(model.modelId).toBe('claude-sonnet-4')
        })

        it('routes a google-ai-studio submodel through the gateway wrapper', () => {
            const model = identify(createCloudflareGatewayModel({ credentials, modelId: 'google-ai-studio/gemini-2.0-flash', routing: 'submodel' }))
            expect(model.modelId).toBe('gemini-2.0-flash')
        })

        it('serialises step metadata into the gateway metadata header', () => {
            const model = identify(createCloudflareGatewayModel({
                credentials,
                modelId: 'mystery/some-model',
                routing: 'submodel',
                metadata: { projectId: 'p1', flowId: 'f1', runId: 'r1' },
            }))
            const headers = model.config?.headers?.() ?? {}
            expect(JSON.parse(headers['cf-aig-metadata'])).toEqual({ projectId: 'p1', flowId: 'f1', runId: 'r1' })
        })
    })

    describe('image models', () => {
        it('builds an image model for an openai submodel', () => {
            const model = identify(createCloudflareGatewayModel({ credentials, modelId: 'openai/dall-e-3', routing: 'submodel', isImage: true }))
            expect(model.modelId).toBe('dall-e-3')
            expect(model.provider).toContain('openai')
        })

        it('builds a compat image model for an unmapped prefix', () => {
            const model = identify(createCloudflareGatewayModel({ credentials, modelId: 'mystery/some-image-model', routing: 'submodel', isImage: true }))
            expect(model.modelId).toBe('mystery/some-image-model')
            expect(model.provider).toContain('cloudflare')
        })
    })
})
