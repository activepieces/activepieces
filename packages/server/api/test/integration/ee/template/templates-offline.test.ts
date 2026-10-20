import { safeHttp } from '@activepieces/server-utils'
import { TemplateType } from '@activepieces/shared'
import { AxiosError } from 'axios'
import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { db } from '../../../helpers/db'
import { createMockTemplate } from '../../../helpers/mocks'
import { createTestContext } from '../../../helpers/test-context'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'

let app: FastifyInstance

beforeAll(async () => {
    app = await setupTestEnvironment()
})

afterAll(async () => {
    await teardownTestEnvironment()
})

afterEach(() => {
    vi.restoreAllMocks()
})

describe('Templates when cloud.activepieces.com is unreachable', () => {
    beforeEach(() => {
        vi.spyOn(safeHttp.axios, 'get').mockRejectedValue(new AxiosError('getaddrinfo ENOTFOUND cloud.activepieces.com', 'ENOTFOUND'))
    })

    it('GET /v1/templates/categories answers 200', async () => {
        const ctx = await createTestContext(app)

        const response = await ctx.get('/v1/templates/categories')

        expect(response.statusCode).toBe(StatusCodes.OK)
    })

    it('GET /v1/templates still lists the platform\'s own templates', async () => {
        const ctx = await createTestContext(app, { plan: { manageTemplatesEnabled: true } })
        const customTemplate = createMockTemplate({ platformId: ctx.platform.id, type: TemplateType.CUSTOM })
        await db.save('template', customTemplate)

        const response = await ctx.get('/v1/templates')

        expect(response.statusCode).toBe(StatusCodes.OK)
        expect(response.json().data.map((template: { id: string }) => template.id)).toEqual([customTemplate.id])
    })

    it('GET /v1/templates/:id answers 404', async () => {
        const ctx = await createTestContext(app)

        const response = await ctx.get('/v1/templates/unknown-template')

        expect(response.statusCode).toBe(StatusCodes.NOT_FOUND)
    })
})

describe('Templates when cloud.activepieces.com is reachable', () => {
    it('GET /v1/templates merges the official templates with the platform\'s own', async () => {
        const ctx = await createTestContext(app, { plan: { manageTemplatesEnabled: true } })
        const customTemplate = createMockTemplate({ platformId: ctx.platform.id, type: TemplateType.CUSTOM })
        await db.save('template', customTemplate)
        const officialTemplate = createMockTemplate({ type: TemplateType.OFFICIAL })
        vi.spyOn(safeHttp.axios, 'get').mockResolvedValue({ data: { data: [officialTemplate], next: null, previous: null } })

        const response = await ctx.get('/v1/templates')

        expect(response.statusCode).toBe(StatusCodes.OK)
        expect(response.json().data.map((template: { id: string }) => template.id)).toEqual([officialTemplate.id, customTemplate.id])
    })

    it('GET /v1/templates/:id calls the cloud with a timeout and keeps the id inside the templates path', async () => {
        const ctx = await createTestContext(app)
        const get = vi.spyOn(safeHttp.axios, 'get').mockRejectedValue(new AxiosError('Request failed with status code 404', 'ERR_BAD_REQUEST'))

        await ctx.get('/v1/templates/..%2F..%2Fflags')

        expect(get).toHaveBeenCalledWith('https://cloud.activepieces.com/api/v1/templates/..%2F..%2Fflags', { timeout: expect.any(Number) })
    })
})
