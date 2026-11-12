import { AIProviderName, apId } from '@activepieces/core-utils'
import { modelTierCatalog } from '@activepieces/server-utils'
import { AiStepAction, PrincipalType } from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { vi } from 'vitest'
import { generateMockToken } from '../../../helpers/auth'
import { mockAndSaveAIProvider } from '../../../helpers/mocks'
import { createTestContext, TestContext } from '../../../helpers/test-context'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'
import { publishedTierReaders } from '../../../unit/app/ee/agent/model-tier-fixture'

const { enqueue } = vi.hoisted(() => ({ enqueue: vi.fn() }))

vi.mock('../../../../src/app/ai/ai-execution', () => ({
    aiExecution: () => ({ serverId: () => 'server-1', enqueue, waitForAnswer: vi.fn() }),
}))

let app: FastifyInstance | null = null
let ctx: TestContext

beforeAll(async () => {
    app = await setupTestEnvironment({ fresh: true })
})

afterAll(async () => {
    await teardownTestEnvironment()
})

beforeEach(async () => {
    ctx = await createTestContext(app!)
    enqueue.mockReset().mockResolvedValue(undefined)
    vi.spyOn(modelTierCatalog, 'current').mockImplementation((surface) => publishedTierReaders[surface])
})

afterEach(() => {
    vi.restoreAllMocks()
})

async function executeAiStep({ action, modelId, provider = AIProviderName.ACTIVEPIECES, providerConfigId }: { action: AiStepAction, modelId: string, provider?: AIProviderName, providerConfigId?: string }) {
    const engineToken = await generateMockToken({
        type: PrincipalType.ENGINE,
        id: apId(),
        projectId: ctx.project.id,
        platform: { id: ctx.platform.id },
    })
    return app!.inject({
        method: 'POST',
        url: '/api/v1/ai/execute',
        headers: { authorization: `Bearer ${engineToken}` },
        body: {
            action,
            flowId: apId(),
            flowRunId: apId(),
            waitpointId: apId(),
            provider,
            ...(providerConfigId ? { providerConfigId } : {}),
            modelId,
            prompt: 'hello',
        },
    })
}

describe('POST /v1/ai/execute', () => {
    it('enqueues the model a tier id points at today, so the worker and billing never see the tier', async () => {
        const response = await executeAiStep({ action: AiStepAction.ASK_AI, modelId: 'deep' })

        expect(response.statusCode).toBe(StatusCodes.OK)
        expect(enqueue).toHaveBeenCalledTimes(1)
        expect(enqueue.mock.calls[0][0]).toMatchObject({
            action: AiStepAction.ASK_AI,
            provider: AIProviderName.ACTIVEPIECES,
            modelId: 'anthropic/claude-fable-5.1',
        })
    })

    it('leaves an image step\'s model alone even when it spells a tier id, because image tiers reuse the text tier ids', async () => {
        const response = await executeAiStep({ action: AiStepAction.GENERATE_IMAGE, modelId: 'smart' })

        expect(response.statusCode).toBe(StatusCodes.OK)
        expect(enqueue).toHaveBeenCalledTimes(1)
        expect(enqueue.mock.calls[0][0]).toMatchObject({
            action: AiStepAction.GENERATE_IMAGE,
            modelId: 'smart',
        })
    })

    it('refuses a specific model the key no longer allows, before anything is queued', async () => {
        const key = await mockAndSaveAIProvider({ platformId: ctx.platform.id, provider: AIProviderName.OPENAI, modelScope: 'selected', modelIds: ['gpt-4o'] })

        const refused = await executeAiStep({ action: AiStepAction.ASK_AI, provider: AIProviderName.OPENAI, providerConfigId: key.id, modelId: 'gpt-4o-mini' })
        const allowed = await executeAiStep({ action: AiStepAction.ASK_AI, provider: AIProviderName.OPENAI, providerConfigId: key.id, modelId: 'gpt-4o' })

        expect(refused.statusCode).toBe(StatusCodes.CONFLICT)
        expect(allowed.statusCode).toBe(StatusCodes.OK)
        expect(enqueue).toHaveBeenCalledTimes(1)
    })
})
