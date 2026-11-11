import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { system } from '../../../../src/app/helper/system/system'
import { AppSystemProp } from '../../../../src/app/helper/system/system-props'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'

let app: FastifyInstance | null = null

beforeAll(async () => {
    app = await setupTestEnvironment()
})

afterAll(async () => {
    await teardownTestEnvironment()
})

describe('GET /api/redirect', () => {
    it('should post the code only to the configured frontend origin', async () => {
        const expectedOrigin = new URL(system.getOrThrow(AppSystemProp.FRONTEND_URL)).origin

        const response = await app?.inject({
            method: 'GET',
            url: '/api/redirect',
            query: { code: 'oauth_code_123' },
        })

        expect(response?.statusCode).toBe(StatusCodes.OK)
        expect(response?.headers['content-type']).toContain('text/html')

        const body = response?.body ?? ''
        expect(body).toContain(`window.opener.postMessage({ code: code }, '${expectedOrigin}')`)
    })

    it('should not HTML-escape the slashes in the target origin', async () => {
        const response = await app?.inject({
            method: 'GET',
            url: '/api/redirect',
            query: { code: 'oauth_code_123' },
        })

        const body = response?.body ?? ''
        expect(body).not.toContain('&#x2F;')
        expect(body).not.toContain('postMessage({ code: code }, \'*\'')
    })

    it('should HTML-escape the code inside the meta attribute', async () => {
        const response = await app?.inject({
            method: 'GET',
            url: '/api/redirect',
            query: { code: 'abc"><script>alert(1)</script>' },
        })

        const body = response?.body ?? ''
        expect(body).not.toContain('abc"><script>alert(1)')
        expect(body).toContain('&quot;')
    })

    it('should return a plain-text error when the code is missing', async () => {
        const response = await app?.inject({
            method: 'GET',
            url: '/api/redirect',
        })

        expect(response?.statusCode).toBe(StatusCodes.OK)
        expect(response?.headers['content-type']).toContain('text/plain')
        expect(response?.body).toBe('The code is missing in url')
    })
})
