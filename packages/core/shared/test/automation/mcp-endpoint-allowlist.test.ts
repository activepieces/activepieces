import { mcpEndpointAllowlistUtil } from '../../src/lib/automation/mcp/mcp-endpoint-allowlist'

const { isServerUrlApproved, isValidEntry } = mcpEndpointAllowlistUtil

describe('mcpEndpointAllowlistUtil.isServerUrlApproved', () => {
    it('approves any url when the allowlist is empty (opt-in passthrough)', () => {
        expect(isServerUrlApproved({ serverUrl: 'https://anything.example.com/sse', allowlist: [] })).toBe(true)
    })

    it('approves any url when the allowlist is null/undefined', () => {
        expect(isServerUrlApproved({ serverUrl: 'https://anything.example.com/sse', allowlist: null })).toBe(true)
        expect(isServerUrlApproved({ serverUrl: 'https://anything.example.com/sse', allowlist: undefined })).toBe(true)
    })

    it('approves an exact host match regardless of path or query', () => {
        expect(isServerUrlApproved({ serverUrl: 'https://mcp.acme.com/sse?x=1', allowlist: ['mcp.acme.com'] })).toBe(true)
    })

    it('rejects a host that is not on the list', () => {
        expect(isServerUrlApproved({ serverUrl: 'https://evil.example.com/sse', allowlist: ['mcp.acme.com'] })).toBe(false)
    })

    it('matches a wildcard against subdomains and the apex', () => {
        expect(isServerUrlApproved({ serverUrl: 'https://mcp.acme.com/sse', allowlist: ['*.acme.com'] })).toBe(true)
        expect(isServerUrlApproved({ serverUrl: 'https://a.b.acme.com/sse', allowlist: ['*.acme.com'] })).toBe(true)
        expect(isServerUrlApproved({ serverUrl: 'https://acme.com/sse', allowlist: ['*.acme.com'] })).toBe(true)
    })

    it('does not let a wildcard match a different registrable domain', () => {
        expect(isServerUrlApproved({ serverUrl: 'https://acme.com.evil.com/sse', allowlist: ['*.acme.com'] })).toBe(false)
        expect(isServerUrlApproved({ serverUrl: 'https://notacme.com/sse', allowlist: ['*.acme.com'] })).toBe(false)
    })

    it('normalizes case and whitespace on both sides', () => {
        expect(isServerUrlApproved({ serverUrl: 'https://MCP.Acme.COM/sse', allowlist: ['  mcp.acme.com  '] })).toBe(true)
    })

    it('ignores the port when matching the host', () => {
        expect(isServerUrlApproved({ serverUrl: 'https://mcp.acme.com:8443/sse', allowlist: ['mcp.acme.com'] })).toBe(true)
    })

    it('rejects an invalid or non-http url when a list is configured', () => {
        expect(isServerUrlApproved({ serverUrl: 'not a url', allowlist: ['mcp.acme.com'] })).toBe(false)
        expect(isServerUrlApproved({ serverUrl: 'ftp://mcp.acme.com/sse', allowlist: ['mcp.acme.com'] })).toBe(false)
    })
})

describe('mcpEndpointAllowlistUtil.isValidEntry', () => {
    it('accepts fully-qualified hosts and wildcard patterns', () => {
        expect(isValidEntry('mcp.acme.com')).toBe(true)
        expect(isValidEntry('acme.com')).toBe(true)
        expect(isValidEntry('*.acme.com')).toBe(true)
        expect(isValidEntry('  mcp.acme.com  ')).toBe(true)
    })

    it('rejects single-label hosts that are not fully qualified', () => {
        expect(isValidEntry('asd')).toBe(false)
        expect(isValidEntry('localhost')).toBe(false)
        expect(isValidEntry('*.com')).toBe(false)
    })

    it('rejects schemes, paths, ports, and whitespace', () => {
        expect(isValidEntry('https://mcp.acme.com')).toBe(false)
        expect(isValidEntry('mcp.acme.com/sse')).toBe(false)
        expect(isValidEntry('mcp.acme.com:8443')).toBe(false)
        expect(isValidEntry('mcp acme com')).toBe(false)
        expect(isValidEntry('')).toBe(false)
    })
})
