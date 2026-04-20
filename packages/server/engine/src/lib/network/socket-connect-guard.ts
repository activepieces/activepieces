import { isIP, Socket } from 'node:net'
import { SSRFBlockedError, ssrfIpClassifier } from '@activepieces/shared'
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
    const first = args[0]
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
    if (!host || isIP(host) === 0) return false
    if (!ssrfIpClassifier.isBlockedIp({ ip: host, allowList: policy.allowList })) return false
    return !isExemptLoopbackPort({ host, port: target?.port, policy })
}

function isExemptLoopbackPort({ host, port, policy }: IsExemptLoopbackPortParams): boolean {
    if (host !== '127.0.0.1' || port === undefined) return false
    return policy.allowedLoopbackPorts.has(port)
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

type IsExemptLoopbackPortParams = {
    host: string
    port: number | undefined
    policy: GuardPolicy
}

type BuildBlockedErrorParams = {
    host: string
    ip: string
}
