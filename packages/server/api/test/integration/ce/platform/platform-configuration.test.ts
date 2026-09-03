import { ApFlagId, DefaultProjectRole } from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { system } from '../../../../src/app/helper/system/system'
import { AppSystemProp } from '../../../../src/app/helper/system/system-props'
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
