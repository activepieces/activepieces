import ipaddr from 'ipaddr.js'

function parseOrNull(ip: string): ipaddr.IPv4 | ipaddr.IPv6 | null {
    try {
        return ipaddr.parse(ip)
    }
    catch {
        return null
    }
}

function isInAllowList({ ip, allowList }: { ip: string, allowList: string[] }): boolean {
    if (allowList.includes(ip)) return true
    const addr = parseOrNull(ip)
    if (!addr) return false
    return allowList.some((entry) => entry.includes('/') && matchesCidr({ addr, cidr: entry }))
}

function matchesCidr({ addr, cidr }: { addr: ipaddr.IPv4 | ipaddr.IPv6, cidr: string }): boolean {
    try {
        const range = ipaddr.parseCIDR(cidr)
        if (addr.kind() !== range[0].kind()) return false
        return addr.match(range)
    }
    catch {
        return false
    }
}

function isBlockedRange(addr: ipaddr.IPv4 | ipaddr.IPv6): boolean {
    if (addr.kind() === 'ipv6') {
        const v6 = addr as ipaddr.IPv6
        if (v6.isIPv4MappedAddress()) {
            return isBlockedRange(v6.toIPv4Address())
        }
    }
    return addr.range() !== 'unicast'
}

function isBlockedIp({ ip, allowList }: { ip: string, allowList: string[] }): boolean {
    if (isInAllowList({ ip, allowList })) {
        return false
    }
    const addr = parseOrNull(ip)
    if (!addr) {
        return true
    }
    return isBlockedRange(addr)
}

export const ssrfIpClassifier = {
    isBlockedIp,
}
