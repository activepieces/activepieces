import ipaddr from 'ipaddr.js'

function parseOrNull(ip: string): ipaddr.IPv4 | ipaddr.IPv6 | null {
    try {
        return ipaddr.parse(ip)
    }
    catch {
        return null
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
    if (allowList.includes(ip)) {
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
