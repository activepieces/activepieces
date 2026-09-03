import { ApEdition } from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { system } from '../../../../src/app/helper/system/system'
import { platformConfigurationService } from '../../../../src/app/platform/platform-configuration.service'
import { createTestContext } from '../../../helpers/test-context'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'

let app: FastifyInstance | null = null

beforeAll(async () => {
    app = await setupTestEnvironment()
})

afterAll(async () => {
    await teardownTestEnvironment()
})

describe('platform configuration on cloud', () => {
    it('runs the suite on the cloud edition', () => {
        expect(system.getEdition()).toBe(ApEdition.CLOUD)
    })

    it('keeps product telemetry on even after the flag is switched off', async () => {
        const ctx = await createTestContext(app!)
        const service = platformConfigurationService(app!.log)

        const stored = await service.update({
            platformId: ctx.platform.id,
            isProductTelemetryEnabled: false,
        })

        expect(stored.isProductTelemetryEnabled).toBe(false)
        expect(await service.isProductTelemetryEnabled({ platformId: ctx.platform.id })).toBe(true)
    })

    it('keeps every project in the run-telemetry filter after the flag is switched off', async () => {
        const ctx = await createTestContext(app!)
        const service = platformConfigurationService(app!.log)

        await service.update({
            platformId: ctx.platform.id,
            isProductTelemetryEnabled: false,
        })

        const enabled = await service.filterProjectsWithProductTelemetryEnabled({
            projectIds: [ctx.project.id],
        })

        expect(enabled).toEqual([ctx.project.id])
    })
})
