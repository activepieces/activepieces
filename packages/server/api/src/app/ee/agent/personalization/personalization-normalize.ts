


export function normalizeRoleTitle({ input }: { input: string }): string | null {
    const trimmed = input.trim().replace(/\s+/g, ' ')
    if (trimmed.length === 0) {
        return null
    }
    return trimmed
        .split(' ')
        .map((word, index) => {
            const lower = word.toLowerCase()
            if (ROLE_ACRONYMS.has(lower)) {
                return lower.toUpperCase()
            }
            if (index > 0 && ROLE_CONNECTORS.has(lower)) {
                return lower
            }
            return word.charAt(0).toUpperCase() + word.slice(1)
        })
        .join(' ')
}


export function normalizeWebsite({ input }: { input: string }): string | null {
    let value = input.trim().toLowerCase()
    if (value.length === 0) {
        return null
    }
    value = value.replace(/^[a-z][a-z0-9+.-]*:\/\//, '').replace(/^\/\//, '')
    const cutAt = value.search(/[/?#:]/)
    if (cutAt >= 0) {
        value = value.slice(0, cutAt)
    }
    value = value.replace(/\.$/, '')
    const labels = value.split('.')
    if (labels[0] === 'www' || labels[0] === 'mail') {
        labels.shift()
    }
    value = labels.join('.')
    if (!HOSTNAME_PATTERN.test(value)) {
        return null
    }
    if (/^\d+\.\d+\.\d+\.\d+$/.test(value) || value === 'localhost' || value.endsWith('.localhost') || value.endsWith('.local')) {
        return null
    }
    return value
}


const HOSTNAME_PATTERN = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/


const ROLE_ACRONYMS: ReadonlySet<string> = new Set(['ceo', 'cto', 'coo', 'cfo', 'cmo', 'cpo', 'cro', 'ciso', 'cio', 'chro', 'vp', 'svp', 'evp', 'hr', 'it', 'qa', 'pr', 'seo', 'sem', 'ux', 'ui', 'ai', 'ml', 'bi', 'l&d', 'r&d', 'gm', 'pm', 'gtm', 'sdr', 'bdr', 'ae', 'sre', 'csm', 'crm', 'saas', 'api'])


const ROLE_CONNECTORS: ReadonlySet<string> = new Set(['of', 'and', 'the', 'for', 'in', 'at', 'to', 'a', 'an', '&'])

