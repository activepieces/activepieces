import { AppConnectionType } from '@activepieces/shared'
import { describe, expect, it } from 'vitest'
import { allowedHostsResolver } from '../../../../src/app/credential-proxy/allowed-hosts-resolver'

describe('allowedHostsResolver', () => {
    it('derives hosts from URL and hostname shaped props, skipping the props being placeholdered', () => {
        const result = allowedHostsResolver.resolve({
            value: {
                type: AppConnectionType.CUSTOM_AUTH,
                props: {
                    base_url: 'https://gitlab.example.com/api/v4/',
                    domain: 'Acme.Atlassian.NET',
                    api_key: 'looks.like.a.host',
                    region: 'eu-west-1',
                    port: 8443,
                },
            },
            excludedPropKeys: new Set(['api_key']),
        })

        expect(result).toEqual({
            allowedHosts: ['gitlab.example.com', 'acme.atlassian.net'],
            allowAnyHost: false,
        })
    })

    it('allows any host when nothing in the value names one', () => {
        expect(allowedHostsResolver.resolve({
            value: { type: AppConnectionType.SECRET_TEXT, secret_text: 'abc' },
            excludedPropKeys: new Set(),
        })).toEqual({ allowedHosts: [], allowAnyHost: true })

        expect(allowedHostsResolver.resolve({
            value: { type: AppConnectionType.CUSTOM_AUTH, props: { token: 'abc', workspace: 'acme' } },
            excludedPropKeys: new Set(['token']),
        })).toEqual({ allowedHosts: [], allowAnyHost: true })
    })

    it('does not treat non-http URLs or bare words as hosts', () => {
        expect(allowedHostsResolver.hostnameOf('postgres://db.internal:5432/app')).toBeNull()
        expect(allowedHostsResolver.hostnameOf('localhost')).toBeNull()
        expect(allowedHostsResolver.hostnameOf('api.example.com')).toBe('api.example.com')
        expect(allowedHostsResolver.hostnameOf(' HTTP://Example.COM:8080/x ')).toBe('example.com')
    })
})
