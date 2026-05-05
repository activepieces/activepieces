import dns from 'node:dns'
import { SSRFBlockedError, ssrfIpClassifier } from '@activepieces/shared'
import type { GuardPolicy, UninstallFn } from './ssrf-guard'

export function installDnsLookupGuard(policy: GuardPolicy): UninstallFn {
    const originalLookup = dns.lookup
    const originalPromisesLookup = dns.promises.lookup
    const boundLookup = originalLookup.bind(dns) as typeof dns.lookup
    const boundPromisesLookup = originalPromisesLookup.bind(dns.promises) as typeof dns.promises.lookup

    const guardedLookup = buildGuardedCallbackLookup({ policy, boundLookup })
    // Preserve util.promisify.custom + __promisify__ that Node attaches to the original
    // callback-style `lookup` — otherwise `dns.promises.lookup` re-derivation breaks.
    Object.assign(guardedLookup, originalLookup)

    const guardedPromisesLookup = buildGuardedPromiseLookup({ policy, boundPromisesLookup })

    assignLookup(dns, guardedLookup)
    assignPromisesLookup(dns.promises, guardedPromisesLookup)

    return () => {
        assignLookup(dns, originalLookup)
        assignPromisesLookup(dns.promises, originalPromisesLookup)
    }
}

function buildGuardedCallbackLookup({ policy, boundLookup }: BuildCallbackLookupParams): GuardedCallbackLookup {
    return function lookup(
        hostname: string,
        optionsOrCallback: dns.LookupOptions | DnsLookupCallback,
        maybeCallback?: DnsLookupCallback,
    ): void {
        const callback = typeof optionsOrCallback === 'function' ? optionsOrCallback : maybeCallback
        const callerOptions = typeof optionsOrCallback === 'object' && optionsOrCallback !== null
            ? optionsOrCallback
            : undefined

        const onResolved: DnsLookupCallback = (err, address, family) => {
            if (err || !callback) {
                callback?.(err, address, family)
                return
            }
            const entries = toAddressList({ address, family })
            const blocked = findBlockedEntry({ entries, allowList: policy.allowList })
            if (blocked) {
                callback(buildBlockedError({ host: hostname, ip: blocked.address }), '' as string, 0)
                return
            }
            if (callerOptions?.all) {
                callback(null, entries)
                return
            }
            const first = entries[0]
            if (!first) {
                callback(null, '' as string, 0)
                return
            }
            callback(null, first.address, first.family)
        }

        boundLookup(hostname, { ...callerOptions, all: true }, onResolved)
    } as GuardedCallbackLookup
}

function buildGuardedPromiseLookup({ policy, boundPromisesLookup }: BuildPromiseLookupParams): GuardedPromiseLookup {
    return async function promiseLookup(hostname, options) {
        const allEntries = await boundPromisesLookup(hostname, { ...options, all: true })
        const blocked = findBlockedEntry({ entries: allEntries, allowList: policy.allowList })
        if (blocked) {
            throw buildBlockedError({ host: hostname, ip: blocked.address })
        }
        return options?.all ? allEntries : allEntries[0]
    }
}

function toAddressList({ address, family }: ToAddressListParams): dns.LookupAddress[] {
    if (Array.isArray(address)) return address
    return [{ address: address as string, family: family ?? 4 }]
}

function findBlockedEntry({ entries, allowList }: FindBlockedEntryParams): dns.LookupAddress | undefined {
    return entries.find((entry) => ssrfIpClassifier.isBlockedIp({ ip: entry.address, allowList }))
}

function buildBlockedError({ host, ip }: BuildBlockedErrorParams): SSRFBlockedError {
    return new SSRFBlockedError({ host, ip })
}

function assignLookup(target: typeof dns, fn: typeof dns.lookup): void {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (target as any).lookup = fn
}

function assignPromisesLookup(target: typeof dns.promises, fn: typeof dns.promises.lookup): void {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (target as any).lookup = fn
}

type DnsLookupCallback = (err: NodeJS.ErrnoException | null, address: string | dns.LookupAddress[], family?: number) => void

type GuardedCallbackLookup = typeof dns.lookup

type GuardedPromiseLookup = typeof dns.promises.lookup

type BuildCallbackLookupParams = {
    policy: GuardPolicy
    boundLookup: typeof dns.lookup
}

type BuildPromiseLookupParams = {
    policy: GuardPolicy
    boundPromisesLookup: typeof dns.promises.lookup
}

type ToAddressListParams = {
    address: string | dns.LookupAddress[]
    family?: number
}

type FindBlockedEntryParams = {
    entries: dns.LookupAddress[]
    allowList: string[]
}

type BuildBlockedErrorParams = {
    host: string
    ip: string
}
