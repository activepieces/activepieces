import { isIP, Socket } from 'node:net'
import { ssrfIpClassifier } from '@activepieces/core-utils'
import { SSRFBlockedError } from '@activepieces/shared'
import type { GuardPolicy, UninstallFn } from './ssrf-guard'

export function installSocketConnectGuard(policy: GuardPolicy): UninstallFn {
    const originalConnect = Socket.prototype.connect
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Socket.prototype.connect = function guardedConnect(this: Socket, ...args: any[]): Socket {
        const target = readConnectTarget(args)
        if (isBlockedRawIpTarget({ target, policy })) {
            this.destroy(buildBlockedError({ host: target!.host!, ip: target!.host! }))
            return this
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (originalConnect as (...a: any[]) => Socket).apply(this, args)
    }
    return () => {
        Socket.prototype.connect = originalConnect
    }
}

function readConnectTarget(args: unknown[]): ConnectTarget | undefined {
    // normalizeArgs hands connect an [options, callback] ARRAY, so skipping arrays waved every fetch through.
    const first = Array.isArray(args[0]) ? args[0][0] : args[0]
    if (typeof first === 'object' && first !== null && !Array.isArray(first)) {
        const opts = first as { host?: string, port?: number }
        return { host: opts.host, port: opts.port }
    }
    if (typeof first === 'number') {
        const host = typeof args[1] === 'string' ? args[1] : '127.0.0.1'
        return { host, port: first }
    }
    return undefined
}

function isBlockedRawIpTarget({ target, policy }: IsBlockedRawIpTargetParams): boolean {
    const host = target?.host
    if (!host) return false
    // A pinned hostname skips the dns blocked-IP check, so it must be scoped to the opened port here.
    const pinned = policy.pinnedHosts.get(host.toLowerCase())
    if (pinned) {
        return !pinned.some((ip) => isExemptHostPort({ host: ip, port: target?.port, policy }))
    }
    if (isIP(host) === 0) return false
    if (!ssrfIpClassifier.isBlockedIp({ ip: host, allowList: policy.allowList })) return false
    return !isExemptHostPort({ host, port: target?.port, policy })
}

function isExemptHostPort({ host, port, policy }: IsExemptHostPortParams): boolean {
    if (port === undefined) return false
    return policy.allowedHostPorts.has(`${host}:${port}`)
}

function buildBlockedError({ host, ip }: BuildBlockedErrorParams): SSRFBlockedError {
    return new SSRFBlockedError({ host, ip })
}

type ConnectTarget = {
    host?: string
    port?: number
}

type IsBlockedRawIpTargetParams = {
    target: ConnectTarget | undefined
    policy: GuardPolicy
}

type IsExemptHostPortParams = {
    host: string
    port: number | undefined
    policy: GuardPolicy
}

type BuildBlockedErrorParams = {
    host: string
    ip: string
}
