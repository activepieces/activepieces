import { AIProviderName } from '@activepieces/core-utils'
import { AIProviderModelType, ApFlagId, DefaultProjectRole, maxBarrierSignalsBounds } from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { databaseConnection } from '../../../../src/app/database/database-connection'
import { system } from '../../../../src/app/helper/system/system'
import { AppSystemProp } from '../../../../src/app/helper/system/system-props'
import { mockAndSaveAIProvider } from '../../../helpers/mocks'
import { createMemberContext, createTestContext } from '../../../helpers/test-context'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'

let app: FastifyInstance | null = null

beforeAll(async () => {
    app = await setupTestEnvironment()
})

afterAll(async () => {
    await teardownTestEnvironment()
})

describe('platform configuration', () => {
    it('creates the row on first read, taking its default from AP_TELEMETRY_ENABLED so an opted-out operator stays opted out', async () => {
        const envDefault = system.getBoolean(AppSystemProp.TELEMETRY_ENABLED) ?? true
        expect(envDefault).toBe(false)

        const ctx = await createTestContext(app!)

        const response = await ctx.get('/v1/platform-configurations')

        expect(response?.statusCode).toBe(StatusCodes.OK)
        const configuration = response!.json()
        expect(configuration.platformId).toBe(ctx.platform.id)
        expect(configuration.isProductTelemetryEnabled).toBe(envDefault)
    })

    it('defaults infra setup telemetry on, independently of AP_TELEMETRY_ENABLED', async () => {
        const ctx = await createTestContext(app!)

        const configuration = (await ctx.get('/v1/platform-configurations'))!.json()

        expect(configuration.isInfraSetupTelemetryEnabled).toBe(true)
    })

    it('creates the barrier signal cap from AP_MAX_BARRIER_SIGNALS', async () => {
        const ctx = await createTestContext(app!)

        const configuration = (await ctx.get('/v1/platform-configurations'))!.json()

        expect(configuration.maxBarrierSignals).toBe(system.getNumberOrThrow(AppSystemProp.MAX_BARRIER_SIGNALS))
    })

    it('persists the barrier signal cap without disturbing telemetry', async () => {
        const ctx = await createTestContext(app!)

        await ctx.post('/v1/platform-configurations', { maxBarrierSignals: 5 })

        const configuration = (await ctx.get('/v1/platform-configurations'))!.json()
        expect(configuration.maxBarrierSignals).toBe(5)
        expect(configuration.isInfraSetupTelemetryEnabled).toBe(true)
    })

    it('refuses a barrier signal cap below one', async () => {
        const ctx = await createTestContext(app!)

        const response = await ctx.post('/v1/platform-configurations', { maxBarrierSignals: 0 })

        expect(response?.statusCode).toBe(StatusCodes.BAD_REQUEST)
        expect((await ctx.get('/v1/platform-configurations'))!.json().maxBarrierSignals).toBe(system.getNumberOrThrow(AppSystemProp.MAX_BARRIER_SIGNALS))
    })

    it('refuses a barrier signal cap above the ten thousand ceiling', async () => {
        const ctx = await createTestContext(app!)

        const response = await ctx.post('/v1/platform-configurations', { maxBarrierSignals: maxBarrierSignalsBounds.max + 1 })

        expect(response?.statusCode).toBe(StatusCodes.BAD_REQUEST)
        expect((await ctx.get('/v1/platform-configurations'))!.json().maxBarrierSignals).toBe(system.getNumberOrThrow(AppSystemProp.MAX_BARRIER_SIGNALS))
    })

    it('accepts a barrier signal cap sitting exactly on the ceiling', async () => {
        const ctx = await createTestContext(app!)

        await ctx.post('/v1/platform-configurations', { maxBarrierSignals: maxBarrierSignalsBounds.max })

        expect((await ctx.get('/v1/platform-configurations'))!.json().maxBarrierSignals).toBe(maxBarrierSignalsBounds.max)
    })

    it('switches each setting without disturbing the other', async () => {
        const ctx = await createTestContext(app!)

        await ctx.post('/v1/platform-configurations', { isInfraSetupTelemetryEnabled: false })

        const afterInfraOff = (await ctx.get('/v1/platform-configurations'))!.json()
        expect(afterInfraOff.isInfraSetupTelemetryEnabled).toBe(false)
        expect(afterInfraOff.isProductTelemetryEnabled).toBe(false)

        await ctx.post('/v1/platform-configurations', { isProductTelemetryEnabled: true })

        const afterProductOn = (await ctx.get('/v1/platform-configurations'))!.json()
        expect(afterProductOn.isProductTelemetryEnabled).toBe(true)
        expect(afterProductOn.isInfraSetupTelemetryEnabled).toBe(false)
    })

    it('persists a switch in both directions', async () => {
        const ctx = await createTestContext(app!)

        const turnedOn = await ctx.post('/v1/platform-configurations', {
            isProductTelemetryEnabled: true,
        })
        expect(turnedOn?.statusCode).toBe(StatusCodes.OK)
        expect(turnedOn!.json().isProductTelemetryEnabled).toBe(true)
        expect((await ctx.get('/v1/platform-configurations'))!.json().isProductTelemetryEnabled).toBe(true)

        await ctx.post('/v1/platform-configurations', { isProductTelemetryEnabled: false })
        expect((await ctx.get('/v1/platform-configurations'))!.json().isProductTelemetryEnabled).toBe(false)
    })

    it('treats an update that carries no fields as a no-op instead of failing', async () => {
        const ctx = await createTestContext(app!)
        await ctx.post('/v1/platform-configurations', { isProductTelemetryEnabled: true })

        const response = await ctx.post('/v1/platform-configurations', {})

        expect(response?.statusCode).toBe(StatusCodes.OK)
        expect(response!.json().isProductTelemetryEnabled).toBe(true)
        expect(response!.json().isInfraSetupTelemetryEnabled).toBe(true)
    })

    it('keeps the row scoped to its own platform', async () => {
        const first = await createTestContext(app!)
        const second = await createTestContext(app!)

        await first.post('/v1/platform-configurations', { isProductTelemetryEnabled: true })

        const firstConfiguration = await first.get('/v1/platform-configurations')
        const secondConfiguration = await second.get('/v1/platform-configurations')

        expect(firstConfiguration!.json().isProductTelemetryEnabled).toBe(true)
        expect(secondConfiguration!.json().isProductTelemetryEnabled).toBe(false)
    })

    it('stops serving TELEMETRY_ENABLED as a flag, since the browser now reads the configuration', async () => {
        const ctx = await createTestContext(app!)

        const response = await app!.inject({
            method: 'GET',
            url: '/api/v1/flags',
            headers: { authorization: `Bearer ${ctx.token}` },
        })

        expect(response.statusCode).toBe(StatusCodes.OK)
        expect(response.json()).not.toHaveProperty('TELEMETRY_ENABLED')
        expect(ApFlagId).not.toHaveProperty('TELEMETRY_ENABLED')
    })

    it('shows specific AI models to builders until an admin hides them, and lets any member read the switch', async () => {
        const ctx = await createTestContext(app!)
        const memberCtx = await createMemberContext(app!, ctx, {
            projectRole: DefaultProjectRole.EDITOR,
        })

        expect((await ctx.get('/v1/platform-configurations'))!.json().aiSpecificModelsVisible).toBe(true)

        const refused = await ctx.post('/v1/platform-configurations', { aiSpecificModelsVisible: false })
        expect(refused?.statusCode).toBe(StatusCodes.CONFLICT)

        const key = await mockAndSaveAIProvider({ platformId: ctx.platform.id, provider: AIProviderName.OPENAI })
        const tier = await ctx.post('/v1/platform-model-tiers', { name: 'Expert', emoji: '🧠', description: null, entries: [{ configId: key.id, modelId: 'gpt-4o' }] })
        expect(tier?.statusCode).toBe(StatusCodes.OK)

        const hidden = await ctx.post('/v1/platform-configurations', { aiSpecificModelsVisible: false })
        expect(hidden?.statusCode).toBe(StatusCodes.OK)
        expect(hidden!.json().aiSpecificModelsVisible).toBe(false)
        expect(hidden!.json().isInfraSetupTelemetryEnabled).toBe(true)

        const memberRead = await memberCtx.get('/v1/platform-configurations')
        expect(memberRead?.statusCode).toBe(StatusCodes.OK)
        expect(memberRead!.json().aiSpecificModelsVisible).toBe(false)

        const memberWrite = await memberCtx.post('/v1/platform-configurations', { aiSpecificModelsVisible: true })
        expect(memberWrite?.statusCode).toBe(StatusCodes.FORBIDDEN)
        expect((await ctx.get('/v1/platform-configurations'))!.json().aiSpecificModelsVisible).toBe(false)
    })

    it('changes nothing when hiding specific models is refused alongside another setting', async () => {
        const ctx = await createTestContext(app!)
        const before = (await ctx.get('/v1/platform-configurations'))!.json().maxBarrierSignals
        expect(before).not.toBe(maxBarrierSignalsBounds.min)

        const refused = await ctx.post('/v1/platform-configurations', { aiSpecificModelsVisible: false, maxBarrierSignals: maxBarrierSignalsBounds.min })

        expect(refused?.statusCode).toBe(StatusCodes.CONFLICT)
        const after = (await ctx.get('/v1/platform-configurations'))!.json()
        expect(after.maxBarrierSignals).toBe(before)
        expect(after.aiSpecificModelsVisible).toBe(true)
    })

    it('saves the default chat model and makes its key the Default AI key', async () => {
        const ctx = await createTestContext(app!)
        const first = await customKey({ platformId: ctx.platform.id, name: 'First', enabledForChat: true })
        const second = await customKey({ platformId: ctx.platform.id, name: 'Second' })
        const defaultChatModel = { type: 'model', provider: AIProviderName.CUSTOM, providerConfigId: second.id, modelId: 'team-model' }

        const response = await ctx.post('/v1/platform-configurations', { defaultChatModel })

        expect(response?.statusCode).toBe(StatusCodes.OK)
        expect(response!.json().defaultChatModel).toEqual(defaultChatModel)
        const keys = await databaseConnection().getRepository('ai_provider').findBy({ platformId: ctx.platform.id })
        expect(keys.filter((key) => key.enabledForChat).map((key) => key.id)).toEqual([second.id])
        expect(first.id).not.toBe(second.id)
    })

    it('refuses a default chat model the key does not offer, and changes nothing', async () => {
        const ctx = await createTestContext(app!)
        const key = await customKey({ platformId: ctx.platform.id, name: 'Team' })

        const response = await ctx.post('/v1/platform-configurations', {
            maxBarrierSignals: 7,
            defaultChatModel: { type: 'model', provider: AIProviderName.CUSTOM, providerConfigId: key.id, modelId: 'not-offered' },
        })

        expect(response?.statusCode).toBe(StatusCodes.CONFLICT)
        const configuration = (await ctx.get('/v1/platform-configurations'))!.json()
        expect(configuration.defaultChatModel ?? null).toBeNull()
        expect(configuration.maxBarrierSignals).not.toBe(7)
    })

    it('clears the default chat model', async () => {
        const ctx = await createTestContext(app!)
        const key = await customKey({ platformId: ctx.platform.id, name: 'Team' })
        await ctx.post('/v1/platform-configurations', { defaultChatModel: { type: 'model', provider: AIProviderName.CUSTOM, providerConfigId: key.id, modelId: 'team-model' } })

        await ctx.post('/v1/platform-configurations', { defaultChatModel: null })

        expect((await ctx.get('/v1/platform-configurations'))!.json().defaultChatModel ?? null).toBeNull()
    })

    it('clears the default chat model when its key is deleted', async () => {
        const ctx = await createTestContext(app!)
        const key = await customKey({ platformId: ctx.platform.id, name: 'Team' })
        await ctx.post('/v1/platform-configurations', { defaultChatModel: { type: 'model', provider: AIProviderName.CUSTOM, providerConfigId: key.id, modelId: 'team-model' } })

        await ctx.delete(`/v1/ai-providers/${key.id}`)

        expect((await ctx.get('/v1/platform-configurations'))!.json().defaultChatModel ?? null).toBeNull()
    })

    it('lets any platform member read the configuration, but only an admin write it', async () => {
        const ctx = await createTestContext(app!)
        const memberCtx = await createMemberContext(app!, ctx, {
            projectRole: DefaultProjectRole.EDITOR,
        })

        const read = await memberCtx.get('/v1/platform-configurations')
        const write = await memberCtx.post('/v1/platform-configurations', {
            isProductTelemetryEnabled: false,
        })

        expect(read?.statusCode).toBe(StatusCodes.OK)
        expect(read!.json().isProductTelemetryEnabled).toBe(false)
        expect(write?.statusCode).toBe(StatusCodes.FORBIDDEN)
    })
})

async function customKey({ platformId, name, enabledForChat }: { platformId: string, name: string, enabledForChat?: boolean }): Promise<{ id: string }> {
    return mockAndSaveAIProvider({
        platformId,
        provider: AIProviderName.CUSTOM,
        displayName: name,
        enabledForChat: enabledForChat ?? false,
        config: {
            baseUrl: 'https://api.example.com/v1',
            apiKeyHeader: 'Authorization',
            models: [{ modelId: 'team-model', modelName: 'team-model', modelType: AIProviderModelType.TEXT }],
        },
    })
}
