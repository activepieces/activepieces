import { tryCatchSync } from '@activepieces/core-utils'
import { AppConnectionType, AppConnectionValue } from '@activepieces/shared'

export const allowedHostsResolver = {
    resolve({ value, excludedPropKeys }: ResolveParams): AllowedHosts {
        const hosts = stringProps({ value, excludedPropKeys })
            .map((prop) => allowedHostsResolver.hostnameOf(prop))
            .filter((host): host is string => host !== null)
        const allowedHosts = Array.from(new Set(hosts))
        return {
            allowedHosts,
            allowAnyHost: allowedHosts.length === 0,
        }
    },
    hostnameOf(raw: string): string | null {
        const trimmed = raw.trim()
        const { data: url } = tryCatchSync(() => new URL(trimmed))
        if (url && (url.protocol === 'http:' || url.protocol === 'https:')) {
            return url.hostname.toLowerCase()
        }
        return HOSTNAME_PATTERN.test(trimmed) ? trimmed.toLowerCase() : null
    },
}

function stringProps({ value, excludedPropKeys }: ResolveParams): string[] {
    switch (value.type) {
        case AppConnectionType.CUSTOM_AUTH:
        case AppConnectionType.OIDC:
            return stringEntries({ props: value.props, excludedPropKeys })
        case AppConnectionType.OAUTH2:
        case AppConnectionType.CLOUD_OAUTH2:
        case AppConnectionType.PLATFORM_OAUTH2:
            return stringEntries({ props: value.props ?? {}, excludedPropKeys })
        case AppConnectionType.SECRET_TEXT:
        case AppConnectionType.BASIC_AUTH:
        case AppConnectionType.NO_AUTH:
            return []
    }
}

function stringEntries({ props, excludedPropKeys }: { props: Record<string, unknown>, excludedPropKeys: Set<string> }): string[] {
    return Object.entries(props)
        .flatMap(([key, prop]) => (typeof prop === 'string' && !excludedPropKeys.has(key) ? [prop] : []))
}

const HOSTNAME_PATTERN = /^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i

type ResolveParams = {
    value: AppConnectionValue
    excludedPropKeys: Set<string>
}

export type AllowedHosts = {
    allowedHosts: string[]
    allowAnyHost: boolean
}
