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

        it('should apply platform theme color overrides on top of the generated theme', async () => {
            const ctx = await createTestContext(app!, {
                platform: {
                    primaryColor: '#ff0000',
                    themeColors: {
                        danger: '#e82c51',
                        selection: '#fbb67e',
                        primary: {
                            dark: '#ca6716',
                        },
                        success: {
                            default: '#00a367',
                        },
                    },
                },
                plan: {
                    customAppearanceEnabled: true,
                },
            })

            const response = await ctx.get('/v1/flags')

            expect(response.statusCode).toBe(StatusCodes.OK)
            const theme = response.json()[ApFlagId.THEME]

            expect(theme.colors.danger).toBe('#e82c51')
            expect(theme.colors.selection).toBe('#fbb67e')
            expect(theme.colors.primary.dark).toBe('#ca6716')
            expect(theme.colors.success).toStrictEqual({ default: '#00a367', light: '#3cad71' })
            // non-overridden colors keep their generated values
            expect(theme.colors.primary.default).toBe('#ff0000')
            expect(theme.colors['blue-link']).toBe('#1890ff')
        })

    })
})
