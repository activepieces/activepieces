import { ActivepiecesError, AIProviderModelType, ErrorCode, OpenAICompatibleProviderConfig, tryCatch } from '@activepieces/shared'
import { describe, expect, it } from 'vitest'
import { openAICompatibleProvider } from '../../../../src/app/ai/providers/openai-compatible-gateway-provider'
import { buildOpenAICompatibleHeaders } from '@activepieces/ai-providers'

const log = { info: () => undefined, warn: () => undefined, error: () => undefined, debug: () => undefined } as never
const auth = { apiKey: 'sk-test' }

const config = (overrides: Partial<OpenAICompatibleProviderConfig> = {}): OpenAICompatibleProviderConfig => ({
    apiKeyHeader: 'Authorization',
    baseUrl: 'https://api.example.com/v1',
    models: [{ modelId: 'gemma-4', modelName: 'Gemma 4', modelType: AIProviderModelType.TEXT }],
    ...overrides,
})

const rejectionFor = async (overrides: Partial<OpenAICompatibleProviderConfig>, apiKey = 'sk-test') => {
    const { error } = await tryCatch(() => openAICompatibleProvider.validateConnection({ apiKey }, config(overrides), log))
    return error instanceof ActivepiecesError ? error.error : undefined
}

describe('openAICompatibleProvider.validateConnection', () => {
    it('accepts a config that can actually be used', async () => {
        await expect(openAICompatibleProvider.validateConnection(auth, config(), log)).resolves.toBeUndefined()
    })

    it('refuses the header name that broke a live tenant, telling them what to enter instead', async () => {
        const rejection = await rejectionFor({ apiKeyHeader: 'authorization: bearer' })

        expect(rejection?.code).toBe(ErrorCode.VALIDATION)
        expect(rejection?.params).toMatchObject({ message: expect.stringContaining('Authorization') })
    })

    it('refuses a base URL that cannot be parsed', async () => {
        for (const baseUrl of ['', 'api.example.com', 'not a url', '/v1']) {
            expect((await rejectionFor({ baseUrl }))?.code, JSON.stringify(baseUrl)).toBe(ErrorCode.VALIDATION)
        }
    })

    it('refuses a base URL the HTTP client could never call', async () => {
        for (const baseUrl of ['file:///etc/passwd', 'ftp://example.com/v1', 'data:text/plain,hi', 'javascript:alert(1)']) {
            expect((await rejectionFor({ baseUrl }))?.code, baseUrl).toBe(ErrorCode.VALIDATION)
        }
    })

    it('refuses an API key that cannot be sent as a header value, and never echoes it back', async () => {
        const rejection = await rejectionFor({}, 'sk-secret\r\nX-Injected: yes')

        expect(rejection?.code).toBe(ErrorCode.VALIDATION)
        expect(JSON.stringify(rejection?.params)).not.toContain('sk-secret')
    })

    it('refuses an extra header value carrying a line break', async () => {
        expect((await rejectionFor({ defaultHeaders: { 'x-tenant': 'acme\r\nX-Injected: yes' } }))?.code).toBe(ErrorCode.VALIDATION)
    })

    it('never echoes the API key header field back, since tenants paste keys into it', async () => {
        const rejection = await rejectionFor({ apiKeyHeader: 'Bearer sk-live-abcdef' })

        expect(rejection?.code).toBe(ErrorCode.VALIDATION)
        expect(JSON.stringify(rejection?.params)).not.toContain('sk-live-abcdef')
    })

    it('refuses an unusable extra header, naming which one', async () => {
        const rejection = await rejectionFor({ defaultHeaders: { 'x-tenant: acme': 'value' } })

        expect(rejection?.code).toBe(ErrorCode.VALIDATION)
        expect(rejection?.params).toMatchObject({ message: expect.stringContaining('x-tenant: acme') })
    })

    it('refuses an empty header name', async () => {
        expect((await rejectionFor({ apiKeyHeader: '' }))?.code).toBe(ErrorCode.VALIDATION)
        expect((await rejectionFor({ apiKeyHeader: '   ' }))?.code).toBe(ErrorCode.VALIDATION)
    })

    it('accepts the header shapes a real gateway needs', async () => {
        for (const apiKeyHeader of ['Authorization', 'x-api-key', 'X_Custom_Key', 'api-key']) {
            await expect(openAICompatibleProvider.validateConnection(auth, config({ apiKeyHeader }), log), apiKeyHeader).resolves.toBeUndefined()
        }
    })

    it('accepts a self-hosted gateway on the local network, which is a normal setup', async () => {
        for (const baseUrl of ['http://localhost:1234/v1', 'http://192.168.2.235:1234/v1', 'https://api.example.com/v1']) {
            await expect(openAICompatibleProvider.validateConnection(auth, config({ baseUrl }), log), baseUrl).resolves.toBeUndefined()
        }
    })

    it('accepts every config it accepts, so nothing it passes can still fail when the request is built', async () => {
        for (const apiKeyHeader of ['Authorization', 'x-api-key', 'X_Custom_Key']) {
            const built = buildOpenAICompatibleHeaders({ apiKeyHeader, apiKey: 'sk-test', defaultHeaders: { 'x-tenant': 'acme' } })
            expect(() => new Headers(built), apiKeyHeader).not.toThrow()
        }
    })
})
