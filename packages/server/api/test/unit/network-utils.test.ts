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

describe('networkUtils request URL derivation', () => {
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

    it('prefers a well-formed Host over a malformed forwarded host', () => {
        const host = networkUtils.getRequestHost(request({ host: 'real.example.com', forwardedHost: 'a b.com' }))

        expect(host).toBe('real.example.com')
    })

    it('falls back to the configured host when neither candidate is usable, and never throws', () => {
        vi.spyOn(system, 'get').mockReturnValue('https://configured.example.com')

        expect(networkUtils.getRequestHost(request({ host: 'a b.com', forwardedHost: '[foo' }))).toBe('configured.example.com')
    })

    it('never throws from getRequestHost even when AP_FRONTEND_URL is unusable, since it runs on every response', () => {
        vi.spyOn(system, 'get').mockReturnValue('localhost:8080')

        expect(networkUtils.getRequestHost(request({ host: 'a b.com' }))).toBe('localhost')
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

    it.each([
        ['uppercase', 'HTTPS'],
        ['mixed case', 'HttpS'],
    ])('honours a forwarded protocol regardless of case (%s), so a TLS-terminating proxy is not downgraded', (_name, forwardedProto) => {
        const baseUrl = networkUtils.getRequestBaseUrl(request({ host: 'example.com', forwardedProto, protocol: 'http' }))

        expect(baseUrl).toBe('https://example.com')
    })

    it('ignores a forwarded protocol that is not http or https', () => {
        const baseUrl = networkUtils.getRequestBaseUrl(request({ host: 'example.com', forwardedProto: 'javascript', protocol: 'https' }))

        expect(baseUrl).toBe('https://example.com')
    })
})
