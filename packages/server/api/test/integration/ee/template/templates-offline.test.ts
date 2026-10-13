import { apId } from '@activepieces/core-utils'
import { TemplateType } from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { db } from '../../../helpers/db'
import { createMockTemplate } from '../../../helpers/mocks'
import { createTestContext } from '../../../helpers/test-context'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'

const CLOUD_TEMPLATES_URL = 'https://cloud.activepieces.com/api/v1/templates'

const CLOUD_FAILURES = [
    {
        name: 'DNS fails',
        respond: async (): Promise<Response> => {
            throw new TypeError('fetch failed')
        },
    },
    {
        name: 'the cloud answers 503',
        respond: async (): Promise<Response> => new Response('<html>Service Unavailable</html>', { status: StatusCodes.SERVICE_UNAVAILABLE }),
    },
]

let app: FastifyInstance

beforeAll(async () => {
    app = await setupTestEnvironment()
})

afterAll(async () => {
    await teardownTestEnvironment()
})

afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
})

describe('Templates when cloud.activepieces.com is unreachable', () => {
    it.each(CLOUD_FAILURES)('GET /v1/templates/categories answers 200 when $name', async ({ respond }) => {
        const ctx = await createTestContext(app)
        stubCloudFetch(respond)

        const response = await ctx.get('/v1/templates/categories')

        expect(response.statusCode).toBe(StatusCodes.OK)
        expect(response.json()).toBeNull()
    })

    it.each(CLOUD_FAILURES)('GET /v1/templates still lists the platform\'s own templates when $name', async ({ respond }) => {
        const ctx = await createTestContext(app, { plan: { manageTemplatesEnabled: true } })
        const customTemplate = createMockTemplate({ platformId: ctx.platform.id, type: TemplateType.CUSTOM })
        await db.save('template', customTemplate)
        stubCloudFetch(respond)

        const response = await ctx.get('/v1/templates')

        expect(response.statusCode).toBe(StatusCodes.OK)
        expect(response.json().data.map((template: { id: string }) => template.id)).toEqual([customTemplate.id])
    })

    it.each(CLOUD_FAILURES)('GET /v1/templates/:id answers 404 for an official template when $name', async ({ respond }) => {
        const ctx = await createTestContext(app)
        stubCloudFetch(respond)

        const response = await ctx.get(`/v1/templates/${apId()}`)

        expect(response.statusCode).toBe(StatusCodes.NOT_FOUND)
    })

    it('GET /v1/templates and /categories fall back when the cloud stalls past the timeout', async () => {
        const ctx = await createTestContext(app)
        const abortSignalTimeout = AbortSignal.timeout.bind(AbortSignal)
        vi.spyOn(AbortSignal, 'timeout').mockImplementation(() => abortSignalTimeout(1))
        stubCloudFetch((init) => new Promise<Response>((_resolve, reject) => {
            init?.signal?.addEventListener('abort', () => reject(init.signal?.reason))
        }))

        const categories = await ctx.get('/v1/templates/categories')
        const templates = await ctx.get('/v1/templates')

        expect(categories.statusCode).toBe(StatusCodes.OK)
        expect(templates.statusCode).toBe(StatusCodes.OK)
        expect(templates.json().data).toEqual([])
        expect(AbortSignal.timeout).toHaveBeenCalled()
    })
})

describe('Templates when cloud.activepieces.com is reachable', () => {
    it('GET /v1/templates/:id keeps the id inside the cloud templates path', async () => {
        const ctx = await createTestContext(app)
        const requestedUrls: string[] = []
        vi.stubGlobal('fetch', async (input: string | URL | Request) => {
            requestedUrls.push(input instanceof Request ? input.url : String(input))
            return new Response(null, { status: StatusCodes.NOT_FOUND })
        })

        const response = await ctx.get('/v1/templates/..%2F..%2Fflags')

        expect(response.statusCode).toBe(StatusCodes.NOT_FOUND)
        expect(requestedUrls).toEqual([`${CLOUD_TEMPLATES_URL}/..%2F..%2Fflags`])
    })

    it('GET /v1/templates/categories returns the cloud categories', async () => {
        const ctx = await createTestContext(app)
        const categories = { id: 'TEMPLATES_CATEGORIES', value: ['Sales', 'HR'] }
        stubCloudFetch(async () => Response.json(categories))

        const response = await ctx.get('/v1/templates/categories')

        expect(response.statusCode).toBe(StatusCodes.OK)
        expect(response.json()).toEqual(categories)
    })

    it('GET /v1/templates merges the official templates with the platform\'s own', async () => {
        const ctx = await createTestContext(app, { plan: { manageTemplatesEnabled: true } })
        const customTemplate = createMockTemplate({ platformId: ctx.platform.id, type: TemplateType.CUSTOM })
        await db.save('template', customTemplate)
        const officialTemplate = createMockTemplate({ type: TemplateType.OFFICIAL })
        stubCloudFetch(async () => Response.json({ data: [officialTemplate], next: null, previous: null }))

        const response = await ctx.get('/v1/templates')

        expect(response.statusCode).toBe(StatusCodes.OK)
        expect(response.json().data.map((template: { id: string }) => template.id)).toEqual([officialTemplate.id, customTemplate.id])
    })

    it('GET /v1/templates/:id returns the official template from the cloud', async () => {
        const ctx = await createTestContext(app)
        const officialTemplate = createMockTemplate({ type: TemplateType.OFFICIAL })
        stubCloudFetch(async () => Response.json(officialTemplate))

        const response = await ctx.get(`/v1/templates/${officialTemplate.id}`)

        expect(response.statusCode).toBe(StatusCodes.OK)
        expect(response.json().id).toBe(officialTemplate.id)
    })
})

function stubCloudFetch(respond: (init?: RequestInit) => Promise<Response>): void {
    const realFetch = globalThis.fetch
    vi.stubGlobal('fetch', async (input: string | URL | Request, init?: RequestInit) => {
        const url = input instanceof Request ? input.url : String(input)
        if (url.startsWith(CLOUD_TEMPLATES_URL)) {
            return respond(init)
        }
        return realFetch(input, init)
    })
}
