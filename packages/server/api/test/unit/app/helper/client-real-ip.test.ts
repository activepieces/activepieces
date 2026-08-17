import { FastifyRequest } from 'fastify'
import { networkUtils } from '../../../../src/app/helper/network-utils'

const HEADER = 'x-real-ip'

function requestFrom({ peer, forwarded }: { peer: string | undefined, forwarded?: string }): FastifyRequest {
    return {
        ip: peer ?? '0.0.0.0',
        socket: { remoteAddress: peer },
        headers: forwarded === undefined ? {} : { [HEADER]: forwarded },
    } as unknown as FastifyRequest
}

describe('networkUtils#extractClientRealIp', () => {
    it('ignores the forwarded header when the caller reached us directly', () => {
        const request = requestFrom({ peer: '203.0.113.9', forwarded: '10.0.0.1' })

        expect(networkUtils.extractClientRealIp(request, HEADER)).toBe('203.0.113.9')
    })

    it('gives a spoofing caller no way to earn a fresh rate-limit bucket', () => {
        const rotated = ['1.1.1.1', '2.2.2.2', '3.3.3.3'].map((spoofed) =>
            networkUtils.extractClientRealIp(requestFrom({ peer: '203.0.113.9', forwarded: spoofed }), HEADER),
        )

        expect(new Set(rotated).size).toBe(1)
    })

    it.each([
        ['127.0.0.1'],
        ['::1'],
        ['::ffff:127.0.0.1'],
        ['10.4.5.6'],
        ['172.16.0.1'],
        ['192.168.1.20'],
        ['100.64.0.5'],
    ])('honours the forwarded header behind a proxy at %s', (peer) => {
        const request = requestFrom({ peer, forwarded: '198.51.100.7' })

        expect(networkUtils.extractClientRealIp(request, HEADER)).toBe('198.51.100.7')
    })

    it.each([
        ['172.15.0.1'],
        ['172.32.0.1'],
        ['192.169.1.1'],
        ['100.128.0.1'],
        ['11.0.0.1'],
    ])('treats %s as public, so its header stays untrusted', (peer) => {
        const request = requestFrom({ peer, forwarded: '198.51.100.7' })

        expect(networkUtils.extractClientRealIp(request, HEADER)).toBe(peer)
    })

    it('takes the original caller from a proxy chain', () => {
        const request = requestFrom({ peer: '127.0.0.1', forwarded: '198.51.100.7, 10.0.0.3' })

        expect(networkUtils.extractClientRealIp(request, HEADER)).toBe('198.51.100.7')
    })

    it('falls back to the socket address rather than a null key when the header is missing', () => {
        const request = requestFrom({ peer: '127.0.0.1' })

        expect(networkUtils.extractClientRealIp(request, HEADER)).toBe('127.0.0.1')
    })

    it('never collapses distinct header-less callers onto one key', () => {
        const keys = ['198.51.100.1', '198.51.100.2', '198.51.100.3'].map((peer) =>
            networkUtils.extractClientRealIp(requestFrom({ peer }), HEADER),
        )

        expect(new Set(keys).size).toBe(3)
    })

    it('falls back when the header is present but empty', () => {
        const request = requestFrom({ peer: '127.0.0.1', forwarded: '' })

        expect(networkUtils.extractClientRealIp(request, HEADER)).toBe('127.0.0.1')
    })

    it('uses the socket address when no header name is configured', () => {
        const request = requestFrom({ peer: '203.0.113.9', forwarded: '10.0.0.1' })

        expect(networkUtils.extractClientRealIp(request, undefined)).toBe('203.0.113.9')
    })
})
