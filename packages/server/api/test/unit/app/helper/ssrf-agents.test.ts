import http from 'node:http'
import https from 'node:https'
import { RequestFilteringHttpAgent, RequestFilteringHttpsAgent } from 'request-filtering-agent'
import { describe, expect, it } from 'vitest'
import { buildAgents } from '../../../../src/app/helper/ssrf-agents'

describe('buildAgents', () => {
    it('returns filtering agents by default', () => {
        const agents = buildAgents({ allowList: [] })
        expect(agents.httpAgent).toBeInstanceOf(RequestFilteringHttpAgent)
        expect(agents.httpsAgent).toBeInstanceOf(RequestFilteringHttpsAgent)
    })

    it('subclasses the stdlib http/https Agent so axios accepts them', () => {
        const agents = buildAgents({ allowList: ['10.0.0.0/8'] })
        expect(agents.httpAgent).toBeInstanceOf(http.Agent)
        expect(agents.httpsAgent).toBeInstanceOf(https.Agent)
    })

    it('forwards the allow list to the underlying filter options', () => {
        const allowList = ['127.0.0.1', '10.0.0.0/8']
        const { httpAgent } = buildAgents({ allowList })
        expect(httpAgent).toBeInstanceOf(RequestFilteringHttpAgent)
    })
})
