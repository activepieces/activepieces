import { ActivepiecesAiCostEvent, AiChargeBasis, AIProviderName } from '@activepieces/core-utils'
import { activepiecesAiCost } from '@activepieces/server-utils'
import { FastifyInstance } from 'fastify'
import FormData from 'form-data'
import { StatusCodes } from 'http-status-codes'
import { mockAndSaveAIProvider } from '../../../helpers/mocks'
import { createTestContext, TestContext } from '../../../helpers/test-context'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'

let app: FastifyInstance

beforeAll(async () => {
    app = await setupTestEnvironment()
})

afterAll(async () => {
    await teardownTestEnvironment()
})

beforeEach(() => {
    vi.stubEnv('AP_OPENROUTER_PROVISION_KEY', 'test-provision-key')
})

afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllEnvs()
})

function embeddingResponse(): Response {
    return new Response(JSON.stringify({
        id: 'gen-embed-1',
        object: 'list',
        data: [{ object: 'embedding', index: 0, embedding: Array.from({ length: 1536 }, () => 0.1) }],
        model: 'openai/text-embedding-3-small',
        usage: { prompt_tokens: 8, total_tokens: 8, cost: 0.00042 },
    }), { status: 200, headers: { 'content-type': 'application/json' } })
}

function upload({ ctx }: { ctx: TestContext }) {
    const form = new FormData()
    form.append('displayName', 'Handbook')
    form.append('file', Buffer.from('The office closes at six.'), { filename: 'doc.txt', contentType: 'text/plain' })
    return app.inject({
        method: 'POST',
        url: `/api/v1/knowledge-base/files/upload?projectId=${ctx.project.id}`,
        headers: { ...form.getHeaders(), authorization: `Bearer ${ctx.token}` },
        payload: form.getBuffer(),
    })
}

describe('embedding an upload on the managed provider', () => {
    it('charges the owning platform and project what the provider reports', async () => {
        const events: ActivepiecesAiCostEvent[] = []
        activepiecesAiCost.setReporter((event) => {
            events.push(event)
        })
        vi.spyOn(globalThis, 'fetch').mockImplementation(async () => embeddingResponse())
        const ctx = await createTestContext(app)
        await mockAndSaveAIProvider({ platformId: ctx.platform.id, provider: AIProviderName.ACTIVEPIECES, enabledForChat: true })

        const response = await upload({ ctx })

        expect(response.statusCode).toBe(StatusCodes.CREATED)
        expect(events).toHaveLength(1)
        expect(events[0].billing.platformId).toBe(ctx.platform.id)
        expect(events[0].billing.projectId).toBe(ctx.project.id)
        expect(events[0].call.charge).toBe(AiChargeBasis.PROVIDER_REPORTED_COST)
        expect(events[0].call).toMatchObject({ costUsd: 0.00042 })
    })

    it('does not charge an own-key provider', async () => {
        const events: ActivepiecesAiCostEvent[] = []
        activepiecesAiCost.setReporter((event) => {
            events.push(event)
        })
        vi.spyOn(globalThis, 'fetch').mockImplementation(async () => embeddingResponse())
        const ctx = await createTestContext(app)
        await mockAndSaveAIProvider({ platformId: ctx.platform.id, provider: AIProviderName.OPENROUTER, enabledForChat: true })

        const response = await upload({ ctx })

        expect(response.statusCode).toBe(StatusCodes.CREATED)
        expect(events).toHaveLength(0)
    })
})
