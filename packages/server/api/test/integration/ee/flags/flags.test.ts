import { ApFlagId } from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { db } from '../../../helpers/db'
import { createMockCustomDomain } from '../../../helpers/mocks'
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

        it('should resolve platform from custom domain when unauthenticated', async () => {
            const ctx = await createTestContext(app!, {
                platform: {
                    primaryColor: '#00ff00',
                    name: 'Domain Platform',
                    fullLogoUrl: 'https://example.com/domain-logo.png',
                    favIconUrl: 'https://example.com/domain-favicon.ico',
                    logoIconUrl: 'https://example.com/domain-icon.svg',
                },
                plan: {
                    customAppearanceEnabled: true,
                },
            })

            const mockCustomDomain = createMockCustomDomain({
                platformId: ctx.platform.id,
                domain: 'custom.example.com',
            })
            await db.save('custom_domain', mockCustomDomain)

            const response = await app?.inject({
                method: 'GET',
                url: '/api/v1/flags',
                headers: {
                    Host: 'custom.example.com',
                },
            })

            expect(response?.statusCode).toBe(StatusCodes.OK)
            const body = response?.json()

            expect(body).toHaveProperty(ApFlagId.THEME)
            const theme = body[ApFlagId.THEME]
            expect(theme.websiteName).toBe('Domain Platform')
            expect(theme.logos.fullLogoUrl).toBe('https://example.com/domain-logo.png')
            expect(theme.colors.primary.default).toBe('#00ff00')
        })
    })
})
