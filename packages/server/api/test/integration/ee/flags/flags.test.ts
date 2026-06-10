import { ApFlagId } from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { createTestContext } from '../../../helpers/test-context'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'

let app: FastifyInstance | null = null

beforeAll(async () => {
    app = await setupTestEnvironment()
})

afterAll(async () => {
    await teardownTestEnvironment()
})

describe('Flags API', () => {
    describe('GET /v1/flags', () => {
        it('should return platform theme when authenticated', async () => {
            const ctx = await createTestContext(app!, {
                platform: {
                    primaryColor: '#ff0000',
                    name: 'Custom Platform',
                    fullLogoUrl: 'https://example.com/full-logo.png',
                    favIconUrl: 'https://example.com/favicon.ico',
                    logoIconUrl: 'https://example.com/logo-icon.svg',
                },
                plan: {
                    customAppearanceEnabled: true,
                },
            })

            const response = await ctx.get('/v1/flags')

            expect(response.statusCode).toBe(StatusCodes.OK)
            const body = response.json()

            expect(body).toHaveProperty(ApFlagId.THEME)
            const theme = body[ApFlagId.THEME]
            expect(theme.websiteName).toBe('Custom Platform')
            expect(theme.logos.fullLogoUrl).toBe('https://example.com/full-logo.png')
            expect(theme.logos.favIconUrl).toBe('https://example.com/favicon.ico')
            expect(theme.logos.logoIconUrl).toBe('https://example.com/logo-icon.svg')
            expect(theme.colors.primary.default).toBe('#ff0000')
        })

    })
})
