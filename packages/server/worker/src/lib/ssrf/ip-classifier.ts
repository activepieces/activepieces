import { isIP } from 'node:net'

export function isBlockedIp({ ip, allowList }: { ip: string, allowList: string[] }): boolean {
    if (allowList.includes(ip)) {
        return false
    }
    const version = isIP(ip)
    if (version === 4) {
        return isBlockedIPv4(ip)
    }
    if (version === 6) {
        return isBlockedIPv6(ip)
    }
    return false
}

function isBlockedIPv4(ip: string): boolean {
    const parts = ip.split('.').map(Number)
    if (parts.length !== 4 || parts.some((n) => Number.isNaN(n) || n < 0 || n > 255)) {
        return true
    }
    const [a, b] = parts
    if (a === 0) return true
    if (a === 10) return true
    if (a === 127) return true
    if (a === 169 && b === 254) return true
    if (a === 172 && b >= 16 && b <= 31) return true
    if (a === 192 && b === 168) return true
    if (a === 100 && b >= 64 && b <= 127) return true
    if (a >= 224) return true
    return false
}

function isBlockedIPv6(ip: string): boolean {
    const lower = ip.toLowerCase().split('%')[0]
    const mapped = extractMappedIPv4(lower)
    if (mapped) {
        return isBlockedIPv4(mapped)
    }
    if (lower === '::1' || lower === '::') return true
    if (lower.startsWith('fe8') || lower.startsWith('fe9') || lower.startsWith('fea') || lower.startsWith('feb')) return true
    if (lower.startsWith('fc') || lower.startsWith('fd')) return true
    if (lower.startsWith('ff')) return true
    if (lower.startsWith('64:ff9b:')) return true
    if (lower.startsWith('2001:db8:')) return true
    return false
}

function extractMappedIPv4(ip: string): string | undefined {
    const prefixes = ['::ffff:', '::']
    for (const prefix of prefixes) {
        if (ip.startsWith(prefix)) {
            const suffix = ip.slice(prefix.length)
            if (isIP(suffix) === 4) {
                return suffix
            }
        }
    }
    return undefined
}
