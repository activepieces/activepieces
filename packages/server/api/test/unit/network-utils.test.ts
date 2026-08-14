import { FastifyRequest } from 'fastify'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { networkUtils } from '../../src/app/helper/network-utils'
import { system } from '../../src/app/helper/system/system'

function request({ host, forwardedHost, forwardedProto, protocol = 'http' }: {
    host: string
    forwardedHost?: string
    forwardedProto?: string
    protocol?: string
}): FastifyRequest {
    const headers: Record<string, string> = {}
    if (forwardedHost !== undefined) {
        headers['x-forwarded-host'] = forwardedHost
    }
    if (forwardedProto !== undefined) {
        headers['x-forwarded-proto'] = forwardedProto
    }
    return { headers, hostname: host, protocol } as unknown as FastifyRequest
}

describe('networkUtils.getRequestBaseUrl', () => {
    afterEach(() => {
        vi.restoreAllMocks()
    })

    it.each([
        ['missing scheme', 'localhost:8080'],
        ['bare hostname', 'ap.example.com'],
        ['non-http scheme', 'file:///opt/ap'],
        ['empty', ''],
    ])('always returns a parseable http(s) URL when AP_FRONTEND_URL is misconfigured (%s)', (_name, frontendUrl) => {
        vi.spyOn(system, 'get').mockReturnValue(frontendUrl)

        const baseUrl = networkUtils.getRequestBaseUrl(request({ host: 'a b.com' }))

        expect(() => new URL(baseUrl)).not.toThrow()
        expect(new URL(baseUrl).protocol).toMatch(/^https?:$/)
    })

    it('never throws from getRequestHost, which runs on every response', () => {
        vi.spyOn(system, 'get').mockReturnValue('localhost:8080')

        expect(() => networkUtils.getRequestHost(request({ host: 'a b.com' }))).not.toThrow()
        expect(() => networkUtils.getRequestHost(request({ host: '[foo' }))).not.toThrow()
    })

    it.each([
        ['space', 'a b.com'],
        ['quote', 'ev"il.com'],
        ['truncated ipv6', '[foo'],
        ['backslash', 'a\\b.com'],
    ])('falls back to a well-formed origin for a malformed host (%s)', (_name, host) => {
        const baseUrl = networkUtils.getRequestBaseUrl(request({ host }))

        expect(() => new URL(baseUrl)).not.toThrow()
        expect(baseUrl).not.toContain(host)
    })

    it.each([
        ['plain', 'customer.example.com'],
        ['explicit port', 'customer.example.com:8443'],
        ['max port', 'customer.example.com:65535'],
        ['ipv6', '[::1]:8080'],
    ])('keeps reflecting a well-formed forwarded host (%s)', (_name, forwardedHost) => {
        const baseUrl = networkUtils.getRequestBaseUrl(request({ host: 'cloud.example.com', forwardedHost, forwardedProto: 'https' }))

        expect(baseUrl).toBe(`https://${forwardedHost}`)
    })

    it('ignores a forwarded protocol that is not http or https', () => {
        const baseUrl = networkUtils.getRequestBaseUrl(request({ host: 'example.com', forwardedProto: 'javascript', protocol: 'https' }))

        expect(baseUrl).toBe('https://example.com')
    })
})
