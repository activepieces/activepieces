import { ApFlagId } from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { defaultTheme } from '../../../../src/app/flags/theme'
import { createTestContext } from '../../../helpers/test-context'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'

let app: FastifyInstance | null = null

beforeAll(async () => {
    app = await setupTestEnvironment()
})

afterAll(async () => {
    await teardownTestEnvironment()
})

describe('Cloud theme follows the plan', () => {
    it('shows the platform branding while the plan includes it', async () => {
        const ctx = await createTestContext(app!, { platform: BRANDED_PLATFORM, plan: { customAppearanceEnabled: true } })

        const theme = (await ctx.get('/v1/flags')).json()[ApFlagId.THEME]

        expect(theme.websiteName).toBe(BRANDED_PLATFORM.name)
        expect(theme.logos.fullLogoUrl).toBe(BRANDED_PLATFORM.fullLogoUrl)
    })

    it('falls back to the default look once the plan no longer includes it', async () => {
        const ctx = await createTestContext(app!, { platform: BRANDED_PLATFORM, plan: { customAppearanceEnabled: false } })

        const theme = (await ctx.get('/v1/flags')).json()[ApFlagId.THEME]

        expect(theme.websiteName).toBe(defaultTheme.websiteName)
        expect(theme.logos.fullLogoUrl).toBe(defaultTheme.logos.fullLogoUrl)
    })
})

const BRANDED_PLATFORM = {
    name: 'Custom Platform',
    fullLogoUrl: 'https://example.com/full-logo.png',
}
