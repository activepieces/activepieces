import { isNil } from '@activepieces/core-utils'

function parseHost(serverUrl: string): string | null {
    try {
        const url = new URL(serverUrl)
        if (url.protocol !== 'http:' && url.protocol !== 'https:') {
            return null
        }
        return url.hostname.toLowerCase()
    }
    catch {
        return null
    }
}

function matchesEntry(host: string, entry: string): boolean {
    const normalizedEntry = entry.trim().toLowerCase()
    if (normalizedEntry.length === 0) {
        return false
    }
    if (normalizedEntry.startsWith('*.')) {
        const base = normalizedEntry.slice(2)
        return base.length > 0 && (host === base || host.endsWith(`.${base}`))
    }
    return host === normalizedEntry
}

// The `+` (not `*`) before the TLD deliberately blocks whole-TLD wildcards like
// `*.com`/`*.pl`: approving an entire public suffix would gut the allowlist. Don't
// relax it — that footgun is the point.
const HOSTNAME_PATTERN = /^(\*\.)?([a-z0-9-]+\.)+[a-z]{2,}$/i

export const mcpEndpointAllowlistUtil = {
    // Empty/unset allowlist is the opt-in passthrough: every endpoint is allowed
    // so existing installs and existing agents keep working until an admin curates a list.
    isServerUrlApproved({ serverUrl, allowlist }: IsServerUrlApprovedParams): boolean {
        if (isNil(allowlist) || allowlist.length === 0) {
            return true
        }
        const host = parseHost(serverUrl)
        if (isNil(host)) {
            return false
        }
        return allowlist.some((entry) => matchesEntry(host, entry))
    },
    isValidEntry(entry: string): boolean {
        const normalized = entry.trim()
        return normalized.length > 0 && HOSTNAME_PATTERN.test(normalized)
    },
}

type IsServerUrlApprovedParams = {
    serverUrl: string
    allowlist: string[] | null | undefined
}
