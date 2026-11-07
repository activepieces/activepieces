import { apId } from '@activepieces/core-utils'
import { ApFlagId, EmbedSubdomainStatus } from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { databaseConnection } from '../../../../src/app/database/database-connection'
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

        it('should return the status colors saved under status, whatever their hex', async () => {
            const ctx = await createTestContext(app!, {
                platform: {
                    themeColors: {
                        status: {
                            danger: '#f94949',
                            success: '#00a367',
                        },
                    },
                },
                plan: {
                    customAppearanceEnabled: true,
                },
            })

            const response = await ctx.get('/v1/flags')

            expect(response.statusCode).toBe(StatusCodes.OK)
            expect(response.json()[ApFlagId.THEME].statusColors).toStrictEqual({
                danger: '#f94949',
                success: '#00a367',
            })
        })

        it('should not read status colors from the fields the old form saved', async () => {
            const ctx = await createTestContext(app!, {
                platform: {
                    themeColors: {
                        avatar: '#515151',
                        danger: '#e82c51',
                        warn: {
                            default: '#f78a3b',
                        },
                    },
                },
                plan: {
                    customAppearanceEnabled: true,
                },
            })

            const response = await ctx.get('/v1/flags')

            expect(response.statusCode).toBe(StatusCodes.OK)
            expect(response.json()[ApFlagId.THEME].statusColors).toStrictEqual({})
        })

        it('should return no status colors when the platform has not set any', async () => {
            const ctx = await createTestContext(app!, {
                plan: {
                    customAppearanceEnabled: true,
                },
            })

            const response = await ctx.get('/v1/flags')

            expect(response.statusCode).toBe(StatusCodes.OK)
            expect(response.json()[ApFlagId.THEME].statusColors).toStrictEqual({})
        })

        it('should return no status colors when custom appearance is not in the plan', async () => {
            const ctx = await createTestContext(app!, {
                platform: {
                    themeColors: {
                        status: {
                            danger: '#e82c51',
                        },
                    },
                },
                plan: {
                    customAppearanceEnabled: false,
                },
            })

            const response = await ctx.get('/v1/flags')

            expect(response.statusCode).toBe(StatusCodes.OK)
            expect(response.json()[ApFlagId.THEME].statusColors).toStrictEqual({})
        })

        describe('EMBED_SUBDOMAIN_URL', () => {
            it('should not return the embed subdomain url when the platform has no embed subdomain', async () => {
                const ctx = await createTestContext(app!)

                const response = await ctx.get('/v1/flags')

                expect(response.statusCode).toBe(StatusCodes.OK)
                expect(response.json()).not.toHaveProperty(ApFlagId.EMBED_SUBDOMAIN_URL)
            })

            it('should not return the embed subdomain url while the embed subdomain is pending verification', async () => {
                const ctx = await createTestContext(app!)
                await saveEmbedSubdomain({ platformId: ctx.platform.id, status: EmbedSubdomainStatus.PENDING_VERIFICATION })

                const response = await ctx.get('/v1/flags')

                expect(response.statusCode).toBe(StatusCodes.OK)
                expect(response.json()).not.toHaveProperty(ApFlagId.EMBED_SUBDOMAIN_URL)
            })

            it('should return the active embed subdomain url and keep the public url on the instance', async () => {
                const ctx = await createTestContext(app!)
                const publicUrlBefore = (await ctx.get('/v1/flags')).json()[ApFlagId.PUBLIC_URL]
                const hostname = await saveEmbedSubdomain({ platformId: ctx.platform.id, status: EmbedSubdomainStatus.ACTIVE })

                const response = await ctx.get('/v1/flags')

                expect(response.statusCode).toBe(StatusCodes.OK)
                const body = response.json()
                expect(body[ApFlagId.EMBED_SUBDOMAIN_URL]).toBe(`https://${hostname}/`)
                expect(body[ApFlagId.WEBHOOK_URL_PREFIX]).toBe(`https://${hostname}/api/v1/webhooks`)
                expect(body[ApFlagId.PUBLIC_URL]).toBe(publicUrlBefore)
            })

            it('should not return another platform\'s embed subdomain url', async () => {
                const platformWithSubdomain = await createTestContext(app!)
                await saveEmbedSubdomain({ platformId: platformWithSubdomain.platform.id, status: EmbedSubdomainStatus.ACTIVE })
                const otherPlatform = await createTestContext(app!)

                const response = await otherPlatform.get('/v1/flags')

                expect(response.statusCode).toBe(StatusCodes.OK)
                expect(response.json()).not.toHaveProperty(ApFlagId.EMBED_SUBDOMAIN_URL)
            })
        })
    })
})

async function saveEmbedSubdomain({ platformId, status }: { platformId: string, status: EmbedSubdomainStatus }): Promise<string> {
    const hostname = `test-${apId().slice(0, 8).toLowerCase()}.example.com`
    await databaseConnection().getRepository('embed_subdomain').save({
        id: apId(),
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
        platformId,
        hostname,
        status,
        cloudflareId: `cf-${apId()}`,
        verificationRecords: [],
    })
    return hostname
}
