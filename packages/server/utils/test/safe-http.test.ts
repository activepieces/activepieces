import http from 'node:http'
import https from 'node:https'
import { RequestFilteringHttpAgent, RequestFilteringHttpsAgent } from 'request-filtering-agent'
import { describe, expect, it } from 'vitest'
import { safeHttp } from '../src/safe-http'

describe('safeHttp.buildAgents', () => {
    it('returns filtering agents by default', () => {
        const agents = safeHttp.buildAgents({ allowList: [] })
        expect(agents.httpAgent).toBeInstanceOf(RequestFilteringHttpAgent)
        expect(agents.httpsAgent).toBeInstanceOf(RequestFilteringHttpsAgent)
    })

    it('subclasses the stdlib http/https Agent so axios accepts them', () => {
        const agents = safeHttp.buildAgents({ allowList: ['10.0.0.0/8'] })
        expect(agents.httpAgent).toBeInstanceOf(http.Agent)
        expect(agents.httpsAgent).toBeInstanceOf(https.Agent)
    })

    it('forwards the allow list to the underlying filter options', () => {
        const allowList = ['127.0.0.1', '10.0.0.0/8']
        const { httpAgent } = safeHttp.buildAgents({ allowList })
        expect(httpAgent).toBeInstanceOf(RequestFilteringHttpAgent)
    })
})

describe('safeHttp.createAxios', () => {
    it('attaches filtering http and https agents to the axios instance', () => {
        const instance = safeHttp.createAxios()
        expect(instance.defaults.httpAgent).toBeInstanceOf(RequestFilteringHttpAgent)
        expect(instance.defaults.httpsAgent).toBeInstanceOf(RequestFilteringHttpsAgent)
    })

    it('merges caller config (e.g. baseURL) with the filtering agents', () => {
        const instance = safeHttp.createAxios({ baseURL: 'https://example.com' })
        expect(instance.defaults.baseURL).toBe('https://example.com')
        expect(instance.defaults.httpsAgent).toBeInstanceOf(RequestFilteringHttpsAgent)
    })
})

describe('safeHttp end-to-end blocking', () => {
    it.each([
        ['loopback v4', 'http://127.0.0.1/'],
        ['loopback v6', 'http://[::1]/'],
        ['private v4', 'http://10.0.0.1/'],
        ['link-local / metadata', 'http://169.254.169.254/latest/meta-data/'],
    ])('rejects %s via safeHttp.axios', async (_label, url) => {
        const instance = safeHttp.createAxios({ timeout: 2000 })
        await expect(instance.get(url)).rejects.toMatchObject({
            message: expect.stringMatching(/DNS lookup .* not allowed|IP .* not allowed|is not allowed/i),
        })
    })
})
