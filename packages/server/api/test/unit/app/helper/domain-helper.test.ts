import { FastifyRequest } from 'fastify'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { domainHelper } from '../../../../src/app/helper/domain-helper'
import { system } from '../../../../src/app/helper/system/system'
import { AppSystemProp } from '../../../../src/app/helper/system/system-props'

const FRONTEND_URL = 'https://apps.example.com/activepieces'
const MCP_URL = 'https://mcp.example.com'

function request({ host, forwardedProto = 'https' }: {
    host: string
    forwardedProto?: string
}): FastifyRequest {
    return {
        headers: { 'x-forwarded-host': host, 'x-forwarded-proto': forwardedProto },
        hostname: host,
        protocol: 'http',
    } as unknown as FastifyRequest
}

function stubSystemProps({ mcpUrl, frontendUrl = FRONTEND_URL }: {
    mcpUrl?: string
    frontendUrl?: string
}): void {
    const realGet = system.get.bind(system)
    const realGetOrThrow = system.getOrThrow.bind(system)
    vi.spyOn(system, 'get').mockImplementation((prop) => {
        if (prop === AppSystemProp.MCP_URL) {
            return mcpUrl
        }
        if (prop === AppSystemProp.FRONTEND_URL) {
            return frontendUrl
        }
        return realGet(prop)
    })
    vi.spyOn(system, 'getOrThrow').mockImplementation((prop) => {
        if (prop === AppSystemProp.FRONTEND_URL) {
            return frontendUrl
        }
        return realGetOrThrow(prop)
    })
}

describe('domainHelper.getPublicUrlFromRequest', () => {
    afterEach(() => {
        vi.restoreAllMocks()
    })

    it('serves the MCP base, without the frontend prefix, on the MCP host', () => {
        stubSystemProps({ mcpUrl: MCP_URL })

        const url = domainHelper.getPublicUrlFromRequest({ req: request({ host: 'mcp.example.com' }) })

        expect(url).toBe('https://mcp.example.com')
    })

    it('keeps the configured prefix on the frontend host', () => {
        stubSystemProps({ mcpUrl: MCP_URL })

        const url = domainHelper.getPublicUrlFromRequest({ req: request({ host: 'apps.example.com' }), path: '/token' })

        expect(url).toBe('https://apps.example.com/activepieces/token')
    })

    it('gives the MCP host its own path prefix when AP_MCP_URL carries one', () => {
        stubSystemProps({ mcpUrl: 'https://mcp.example.com/gateway' })

        const url = domainHelper.getPublicUrlFromRequest({ req: request({ host: 'mcp.example.com' }), path: '/authorize' })

        expect(url).toBe('https://mcp.example.com/gateway/authorize')
    })

    it('trusts the configured protocol when the proxy forwards no x-forwarded-proto', () => {
        stubSystemProps({ mcpUrl: MCP_URL })

        const url = domainHelper.getPublicUrlFromRequest({ req: request({ host: 'mcp.example.com', forwardedProto: '' }) })

        expect(url).toBe('https://mcp.example.com')
    })

    it('does not double the slash when a configured URL ends in one', () => {
        stubSystemProps({ mcpUrl: 'https://mcp.example.com/' })

        const url = domainHelper.getPublicUrlFromRequest({ req: request({ host: 'mcp.example.com' }), path: '/mcp' })

        expect(url).toBe('https://mcp.example.com/mcp')
    })

    it('falls back to the request host plus the frontend prefix for an unconfigured host', () => {
        stubSystemProps({ mcpUrl: MCP_URL })

        const url = domainHelper.getPublicUrlFromRequest({ req: request({ host: 'custom.customer.com' }), path: '/token' })

        expect(url).toBe('https://custom.customer.com/activepieces/token')
    })

    it('behaves exactly as before when AP_MCP_URL is unset', () => {
        stubSystemProps({ mcpUrl: undefined })

        expect(domainHelper.getPublicUrlFromRequest({ req: request({ host: 'mcp.example.com' }), path: '/token' }))
            .toBe('https://mcp.example.com/activepieces/token')
        expect(domainHelper.getPublicUrlFromRequest({ req: request({ host: 'apps.example.com' }), path: '/token' }))
            .toBe('https://apps.example.com/activepieces/token')
    })
})

describe('domainHelper.isMcpHostRequest', () => {
    afterEach(() => {
        vi.restoreAllMocks()
    })

    it('is true only on the MCP host', () => {
        stubSystemProps({ mcpUrl: MCP_URL })

        expect(domainHelper.isMcpHostRequest({ req: request({ host: 'mcp.example.com' }) })).toBe(true)
        expect(domainHelper.isMcpHostRequest({ req: request({ host: 'apps.example.com' }) })).toBe(false)
        expect(domainHelper.isMcpHostRequest({ req: request({ host: 'custom.customer.com' }) })).toBe(false)
    })

    it('is false everywhere when AP_MCP_URL is unset', () => {
        stubSystemProps({ mcpUrl: undefined })

        expect(domainHelper.isMcpHostRequest({ req: request({ host: 'mcp.example.com' }) })).toBe(false)
        expect(domainHelper.isMcpHostRequest({ req: request({ host: 'apps.example.com' }) })).toBe(false)
    })
})

describe('domainHelper.getMcpUrl', () => {
    afterEach(() => {
        vi.restoreAllMocks()
    })

    it('uses AP_MCP_URL when set', () => {
        stubSystemProps({ mcpUrl: MCP_URL })

        expect(domainHelper.getMcpUrl({ path: '/mcp' })).toBe('https://mcp.example.com/mcp')
    })

    it('falls back to AP_FRONTEND_URL, prefix included, when unset', () => {
        stubSystemProps({ mcpUrl: undefined })

        expect(domainHelper.getMcpUrl({ path: '/mcp' })).toBe('https://apps.example.com/activepieces/mcp')
    })

    it('does not double the slash when AP_FRONTEND_URL ends in one', () => {
        stubSystemProps({ mcpUrl: undefined, frontendUrl: 'https://apps.example.com/' })

        expect(domainHelper.getMcpUrl({ path: '/mcp' })).toBe('https://apps.example.com/mcp')
    })
})
