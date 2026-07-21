import { randomBytes } from 'node:crypto'
import dns from 'node:dns'
import { readFile, stat } from 'node:fs/promises'
import { createServer as createNetServer, Server as NetServer } from 'node:net'
import { isNil, tryCatch, tryCatchSync } from '@activepieces/core-utils'
import { spawnWithKill } from '../utils/exec'
import { sandboxCapacity } from './capacity'
import { SandboxLogger } from './types'

export async function prepareEgressEnvironment({ log, allowList }: { log: SandboxLogger, allowList?: string[] }): Promise<EgressNetworkLease> {
    const lease = await acquireEgressNetworkLease()
    const { error } = await tryCatch(async () => {
        await assertEgressCapabilities()
        // At readiness, not per job, so a real collision pauses polling instead of failing jobs forever.
        await assertNoSubnetOverlap({ log, base: resolveEgressBaseSubnet() })
        // Logs only; toKernelAllowCidrs drops bad entries rather than throwing, and re-runs per box at create.
        toKernelAllowCidrs({ allowList: allowList ?? [], log })
        await warnOnSuspectedHostNetwork({ log })
        await cleanupStaleEgress({ log })
    })
    if (error) {
        const { error: releaseError } = await tryCatch(() => lease.release())
        if (releaseError) {
            log.error({ error: String(releaseError) }, 'Failed to release egress network ownership after preparation failure')
        }
        throw error
    }
    return lease
}

export async function acquireEgressNetworkLease(): Promise<EgressNetworkLease> {
    const server = createNetServer((socket) => socket.destroy())
    const { error } = await tryCatch(() => listenOnAbstractSocket({ server, socketName: EGRESS_LEASE_SOCKET }))
    if (error) {
        throw new EgressNetnsError(
            'another STRICT sandbox worker already owns this network namespace. Run one worker per container/pod network namespace and disable host-network sharing.',
        )
    }
    server.unref()
    return {
        release: () => closeNetServer(server),
    }
}

export function createEgressNetns(params: CreateParams): Promise<EgressNetns> {
    // Every resource name derives from boxId alone, so a teardown racing a create would delete the replacement.
    return serializePerBox(params.boxId, () => createEgressNetnsInner(params))
}

async function createEgressNetnsInner({ log, boxId, internalApiUrl, allowList, apiEgress: providedApiEgress }: CreateParams): Promise<EgressNetns> {
    // Tooling presence only; the CAP_NET_ADMIN probe runs once at readiness in assertEgressCapabilities.
    await assertToolingAvailable()

    const base = resolveEgressBaseSubnet()
    const topology = buildTopology(boxId, base)

    // A loopback app URL is the namespace's own empty loopback inside the netns, so it moves to the gateway.
    const loopbackCallback = isNil(internalApiUrl) ? null : resolveCallbackRewrite({ internalApiUrl, gatewayHost: topology.gatewayHost })
    const operatorAllowCidrs = toKernelAllowCidrs({ allowList: allowList ?? [], log })
    // Reuse the caller's resolution: re-resolving could differ from the address set its cache key recorded.
    const apiEgress = providedApiEgress ?? await resolveApiEgressCached({ internalApiUrl, log })
    // apiEgress can be caller-injected, so this is the only place that still guarantees no forbidden ACCEPT.
    const apiAllowEndpoints = apiEgress.endpoints.filter((endpoint) => !isForbiddenKernelAllowCidr(endpoint.cidr))
    const callbackApiUrl = loopbackCallback?.url ?? null
    const callbackPort = loopbackCallback?.port ?? null
    const apiAllow = apiAllowEndpoints.length === 0
        ? null
        : apiAllowEndpoints.map((endpoint) => `${endpoint.ip}:${endpoint.port}`).join(',')
    // Hand the engine the addresses; rewriting the URL to one would drop SNI and corrupt the Host header.
    const apiHostPin = isNil(apiEgress.pinHostname) || apiAllowEndpoints.length === 0
        ? null
        : `${apiEgress.pinHostname}=${apiAllowEndpoints.map((endpoint) => endpoint.ip).join(',')}`

    // A sub-1500 uplink would otherwise leave the box emitting oversized frames that partially blackhole.
    const mtu = await resolveUplinkMtu({ log })

    await assertNetnsNotInUse({ log, topology })
    await preflightCleanup({ log, topology })

    for (const command of buildCreateCommands(topology, {
        callbackPort: loopbackCallback?.port,
        allowCidrs: operatorAllowCidrs,
        apiAllowEndpoints,
        mtu,
    })) {
        const { error } = await tryCatch(() => runCommand(command))
        if (error) {
            log.error({ error: String(error), command: `${command.binary} ${command.args.join(' ')}` }, 'egress netns setup step failed; rolling back')
            await guardedDestroy({ log, topology })
            throw new EgressNetnsError(
                `Egress netns setup failed at "${command.binary} ${command.args.join(' ')}". SANDBOX_PROCESS + STRICT needs CAP_NET_ADMIN, iproute2 and iptables in the worker image. ${error.message}`,
            )
        }
    }

    const owner = Symbol(`egress-box-${boxId}`)
    boxOwners.set(boxId, owner)

    log.info({ netnsName: topology.netnsName, gatewayHost: topology.gatewayHost, boxId, callbackApiUrl, apiAllow, apiHostPin }, 'Egress network namespace created')
    return {
        netnsName: topology.netnsName,
        gatewayHost: topology.gatewayHost,
        callbackApiUrl,
        callbackPort,
        apiAllow,
        apiHostPin,
        fingerprint: apiEgress.fingerprint,
        destroy: () => serializePerBox(boxId, async () => {
            if (boxOwners.get(boxId) !== owner) {
                log.debug({ boxId, netnsName: topology.netnsName }, 'Skipping egress teardown — superseded by a newer namespace for this box')
                return
            }
            const cleaned = await guardedDestroy({ log, topology })
            if (cleaned) {
                boxOwners.delete(boxId)
            }
        }),
    }
}

function serializePerBox<T>(boxId: number, operation: () => Promise<T>): Promise<T> {
    const previous = boxOperationLocks.get(boxId) ?? Promise.resolve()
    const result = previous.then(operation, operation)
    boxOperationLocks.set(boxId, result.then(() => undefined, () => undefined))
    return result
}

async function guardedDestroy({ log, topology }: { log: SandboxLogger, topology: NetnsTopology }): Promise<boolean> {
    let severed = false
    for (const command of buildSeverCommands(topology)) {
        const { error } = await tryCatch(() => runCommand(command))
        if (isNil(error) && isVethSeverCommand({ command, vethHost: topology.vethHost })) {
            severed = true
        }
        else if (!isNil(error)) {
            log.warn({ error: String(error), command: `${command.binary} ${command.args.join(' ')}` }, 'egress sever step failed (best-effort)')
        }
    }
    if (!severed && await isVethAbsent(topology.vethHost)) {
        severed = true
    }
    if (!severed) {
        log.error({ boxId: topology.boxId, netnsName: topology.netnsName }, 'Could not confirm the box veth is down/absent; LEAVING firewall rules armed (fail-closed) rather than exposing an unfiltered box')
        return false
    }
    for (const command of buildFilterCleanupCommands(topology)) {
        const { error } = await tryCatch(() => runCommand(command))
        if (error) {
            log.warn({ error: String(error), command: `${command.binary} ${command.args.join(' ')}` }, 'egress filter cleanup command failed (best-effort)')
        }
    }
    return true
}

async function isVethAbsent(vethHost: string): Promise<boolean> {
    const { error } = await tryCatch(() => spawnWithKill({ cmd: 'ip', args: ['link', 'show', vethHost], timeoutMs: COMMAND_TIMEOUT_MS }))
    if (isNil(error)) {
        return false
    }
    // Only iproute2's "device not found" proves absence; a timeout or spawn error reads as PRESENT, fail-closed.
    return /does not exist|Cannot find device/i.test(error.message)
}

function isVethSeverCommand({ command, vethHost }: { command: NetnsCommand, vethHost: string }): boolean {
    if (command.binary !== 'ip' || command.args[0] !== 'link') {
        return false
    }
    const isDown = command.args[1] === 'set' && command.args[2] === vethHost && command.args.includes('down')
    const isDelete = command.args[1] === 'del' && command.args[2] === vethHost
    return isDown || isDelete
}

async function inspectNetns({ netnsName }: { netnsName: string }): Promise<NetnsInspection> {
    // Errors propagate: a failed inspection must never read as "zero pids", which would destroy a live netns.
    const listing = await listCommand({ cmd: 'ip', args: ['netns', 'list'] })
    if (!listing.split('\n').some((line) => lineHasNetnsName({ line, netnsName }))) {
        return { exists: false }
    }
    const result = await spawnWithKill({ cmd: 'ip', args: ['netns', 'pids', netnsName], timeoutMs: COMMAND_TIMEOUT_MS })
    const pids = result.stdout.split('\n').map((line) => line.trim()).filter((line) => /^\d+$/.test(line))
    return { exists: true, pids }
}

function lineHasNetnsName({ line, netnsName }: { line: string, netnsName: string }): boolean {
    return line === netnsName || line.startsWith(`${netnsName} `)
}

async function assertNetnsNotInUse({ log, topology }: { log: SandboxLogger, topology: NetnsTopology }): Promise<void> {
    let inspection = await inspectNetns({ netnsName: topology.netnsName })
    for (let attempt = 0; attempt < NETNS_FREE_RETRIES && inspection.exists && inspection.pids.length > 0; attempt++) {
        log.debug({ netnsName: topology.netnsName, pids: inspection.pids }, 'Egress namespace still has live pids; waiting for them to exit')
        await delay(NETNS_FREE_RETRY_DELAY_MS)
        inspection = await inspectNetns({ netnsName: topology.netnsName })
    }
    if (inspection.exists && inspection.pids.length > 0) {
        log.warn({ netnsName: topology.netnsName, pids: inspection.pids }, 'Egress namespace still has live pids after wait; SIGKILL orphans then re-check')
        await killOrphanPids({ netnsName: topology.netnsName, log })
        for (let attempt = 0; attempt < ORPHAN_KILL_REAP_RETRIES; attempt++) {
            await delay(NETNS_FREE_RETRY_DELAY_MS)
            inspection = await inspectNetns({ netnsName: topology.netnsName })
            if (!inspection.exists || inspection.pids.length === 0) {
                return
            }
        }
        log.error({ netnsName: topology.netnsName, pids: inspection.pids }, 'Egress namespace still has live processes after SIGKILL; refusing to reuse it')
        throw new EgressNetnsError(
            `network namespace ${topology.netnsName} is still in use by ${inspection.pids.length} live process(es) after SIGKILL. ` +
            'Terminate the orphaned sandbox before restarting STRICT execution.',
        )
    }
}

// Runs as root, so re-confirm each pid still resolves to this namespace before signalling a recycled pid.
async function killOrphanPids({ netnsName, log }: { netnsName: string, log: SandboxLogger }): Promise<void> {
    const target = await statOrNull(`/run/netns/${netnsName}`)
    if (isNil(target)) {
        log.warn({ netnsName }, 'Cannot stat the egress namespace; skipping orphan SIGKILL rather than risk signalling an unrelated pid')
        return
    }
    // Swallowed: a failed re-read must not fail readiness, and the caller's stale list is the risk being removed.
    const { data: inspection } = await tryCatch(() => inspectNetns({ netnsName }))
    if (isNil(inspection) || !inspection.exists) {
        log.warn({ netnsName }, 'Could not re-read the egress namespace pid list; skipping orphan SIGKILL')
        return
    }
    for (const pidText of inspection.pids) {
        const pid = Number(pidText)
        if (!Number.isInteger(pid) || pid <= 1 || pid === process.pid || pid === process.ppid) {
            continue
        }
        const owner = await statOrNull(`/proc/${pid}/ns/net`)
        // Inode numbers are unique only per superblock, so the device must match too.
        if (isNil(owner) || owner.dev !== target.dev || owner.ino !== target.ino) {
            log.warn({ pid: pidText, netnsName }, 'Skipping orphan SIGKILL — pid no longer resolves to this egress namespace (exited, recycled, or not readable)')
            continue
        }
        const { error } = tryCatchSync(() => {
            process.kill(pid, 'SIGKILL')
        })
        if (error) {
            log.warn({ pid: pidText, error: String(error) }, 'Failed to SIGKILL orphan egress namespace pid')
        }
    }
}

async function statOrNull(path: string): Promise<{ dev: number, ino: number } | null> {
    const { data } = await tryCatch(() => stat(path))
    return isNil(data) ? null : { dev: data.dev, ino: data.ino }
}

function delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
}

async function preflightCleanup({ log, topology }: { log: SandboxLogger, topology: NetnsTopology }): Promise<void> {
    const cleaned = await guardedDestroy({ log, topology })
    if (!cleaned) {
        log.debug({ netnsName: topology.netnsName }, 'egress netns preflight could not sever prior path; leaving filters armed')
    }
}

async function assertIpForwardingEnabled(): Promise<void> {
    const forwardPath = '/proc/sys/net/ipv4/ip_forward'
    const { data: current, error } = await tryCatch(() => readFile(forwardPath, 'utf8'))
    if (current?.trim() !== '1') {
        throw new EgressNetnsError(
            `net.ipv4.ip_forward is not 1, so the sandbox would have no egress. Enable it on the host or node before starting STRICT isolate workers; the worker never writes it. ${error?.message ?? ''}`,
        )
    }
}

export async function cleanupStaleEgress({ log }: { log: SandboxLogger }): Promise<void> {
    if (staleSwept) {
        return
    }
    const boxIds = await inventoryStaleBoxIds()
    const base = resolveEgressBaseSubnet()
    for (const boxId of boxIds) {
        const topology = buildTopology(boxId, base)
        await serializePerBox(boxId, async () => {
            // Inside the lock, or it is a TOCTOU that sweeps a box whose create had not yet recorded ownership.
            if (boxOwners.has(boxId)) {
                return
            }
            const inspection = await inspectNetns({ netnsName: topology.netnsName })
            if (inspection.exists && inspection.pids.length > 0) {
                log.warn({ netnsName: topology.netnsName, pids: inspection.pids }, 'Stale egress namespace has live pids; SIGKILL orphans before cleanup')
                await killOrphanPids({ netnsName: topology.netnsName, log })
                for (let attempt = 0; attempt < ORPHAN_KILL_REAP_RETRIES; attempt++) {
                    await delay(NETNS_FREE_RETRY_DELAY_MS)
                    const again = await inspectNetns({ netnsName: topology.netnsName })
                    if (!again.exists || again.pids.length === 0) {
                        break
                    }
                    if (attempt === ORPHAN_KILL_REAP_RETRIES - 1) {
                        throw new EgressNetnsError(
                            `cannot clean stale namespace ${topology.netnsName} while ${again.pids.length} process(es) still use it after SIGKILL`,
                        )
                    }
                }
            }
            await guardedDestroy({ log, topology })
        })
    }
    staleSwept = true
    if (boxIds.length > 0) {
        log.info({ boxIds }, 'Swept stale egress resources left by a previous worker process')
    }
}

async function inventoryStaleBoxIds(): Promise<number[]> {
    // A crash leaks a netns, a veth or a chain independently, so all three listings have to be unioned.
    const ids = new Set<number>()
    const listings = await Promise.all([
        listCommandBestEffort({ cmd: 'ip', args: ['netns', 'list'] }),
        listCommandBestEffort({ cmd: 'ip', args: ['-o', 'link', 'show'] }),
        listCommandBestEffort({ cmd: 'iptables', args: ['-S'] }),
        listCommandBestEffort({ cmd: 'iptables', args: ['-t', 'nat', '-S'] }),
    ])
    for (const boxId of parseNetnsBoxIds(listings[0])) {
        ids.add(boxId)
    }
    for (const boxId of parseResourceBoxIds(listings.slice(1).join('\n'))) {
        ids.add(boxId)
    }
    return [...ids]
}

async function listCommandBestEffort(command: { cmd: string, args: string[] }): Promise<string> {
    const { data, error } = await tryCatch(() => listCommand(command))
    if (!isNil(error) || isNil(data)) {
        return ''
    }
    return data
}

function parseNetnsBoxIds(listing: string): number[] {
    const ids = new Set<number>()
    for (const line of listing.split('\n')) {
        const match = line.match(/^ap-egress-(\d+)\b/)
        if (match) {
            ids.add(Number(match[1]))
        }
    }
    return [...ids]
}

function parseResourceBoxIds(listing: string): number[] {
    // Matches our veth (`ap-veth-h<box>`) and iptables chains (`AP_EG_FWD_<box>` / `AP_EG_IN_<box>`).
    const ids = new Set<number>()
    for (const match of listing.matchAll(/(?:ap-veth-h|AP_EG_FWD_|AP_EG_IN_)(\d+)\b/g)) {
        ids.add(Number(match[1]))
    }
    return [...ids]
}

async function listCommand(command: { cmd: string, args: string[] }): Promise<string> {
    const result = await spawnWithKill({ cmd: command.cmd, args: command.args, timeoutMs: COMMAND_TIMEOUT_MS })
    return result.stdout
}

async function runCommand(command: NetnsCommand): Promise<void> {
    const { binary, args } = withXtablesWait(command)
    await spawnWithKill({ cmd: binary, args, timeoutMs: COMMAND_TIMEOUT_MS })
}

function withXtablesWait({ binary, args }: NetnsCommand): NetnsCommand {
    // ip netns exec does not unshare /run, so in-netns ip6tables contends on the same xtables.lock as the host's.
    const tokens = [binary, ...args]
    const xtablesIdx = tokens.findIndex((token) => token === 'iptables' || token === 'ip6tables')
    if (xtablesIdx === -1) {
        return { binary, args }
    }
    const withWait = [...tokens.slice(0, xtablesIdx + 1), '--wait', String(XTABLES_WAIT_SECONDS), ...tokens.slice(xtablesIdx + 1)]
    return { binary: withWait[0], args: withWait.slice(1) }
}

function resolveCallbackRewrite({ internalApiUrl, gatewayHost }: { internalApiUrl: string, gatewayHost: string }): CallbackRewrite | null {
    const { data: parsed } = tryCatchSync(() => new URL(internalApiUrl))
    if (isNil(parsed) || !isLoopbackHostname(parsed.hostname)) {
        return null
    }
    const port = parsed.port !== '' ? Number(parsed.port) : defaultPortForProtocol(parsed.protocol)
    if (!Number.isInteger(port) || port <= 0 || port > 65535) {
        return null
    }
    parsed.hostname = gatewayHost
    return { port, url: parsed.toString() }
}

// A failed lookup rides the last known-good answer for a bounded window, then throws.
export async function resolveApiEgressCached({ internalApiUrl, log }: { internalApiUrl: string | undefined, log: SandboxLogger }): Promise<ApiEgressResolution> {
    const cacheKey = internalApiUrl?.trim() ?? ''
    const now = Date.now()
    const cached = apiEgressCache.get(cacheKey)
    if (!isNil(cached) && now < cached.freshUntil) {
        return cached.resolution
    }
    const { data, error } = await tryCatch(() => resolveApiEgress({ internalApiUrl, log }))
    if (isNil(error) && !isNil(data)) {
        apiEgressCache.set(cacheKey, {
            resolution: data,
            freshUntil: now + API_EGRESS_TTL_MS,
            // Anchored to this SUCCESS, so repeated stale serves never extend the window.
            staleUntil: now + API_EGRESS_STALE_LIMIT_MS,
        })
        return data
    }
    // Only a lookup failure is transient; a bad URL or an all-forbidden resolution must stay loud.
    if (!(error instanceof ApiDnsLookupError)) {
        throw error ?? new EgressNetnsError(`cannot resolve the app API address for "${internalApiUrl ?? ''}"`)
    }
    if (isNil(cached) || now >= cached.staleUntil) {
        log.error(
            { internalApiUrl, error: String(error) },
            'App API address is unresolvable and there is no usable last known-good result left; failing STRICT egress setup',
        )
        throw error
    }
    log.warn(
        { internalApiUrl, error: String(error), apiAllow: cached.resolution.fingerprint },
        'Could not re-resolve the app API address; reusing the last known-good result. STRICT egress rules are unchanged',
    )
    return cached.resolution
}

async function resolveApiEgress({ internalApiUrl, log }: { internalApiUrl: string | undefined, log: SandboxLogger }): Promise<ApiEgressResolution> {
    if (isNil(internalApiUrl) || internalApiUrl.trim() === '') {
        return EMPTY_API_EGRESS
    }
    const { data: parsed } = tryCatchSync(() => new URL(internalApiUrl))
    if (isNil(parsed)) {
        throw new EgressNetnsError(
            `internalApiUrl "${internalApiUrl}" is not a valid URL; cannot open STRICT egress to the app API. ` +
            'Fix AP_FRONTEND_URL / the worker API URL.',
        )
    }
    const hostname = parsed.hostname.replace(/^\[|\]$/g, '')
    if (isLoopbackHostname(hostname)) {
        return EMPTY_API_EGRESS
    }
    const port = parsed.port !== '' ? Number(parsed.port) : defaultPortForProtocol(parsed.protocol)
    if (!Number.isInteger(port) || port <= 0 || port > 65535) {
        throw new EgressNetnsError(
            `internalApiUrl "${internalApiUrl}" has an invalid port; cannot open STRICT egress to the app API.`,
        )
    }
    const ips = await resolveApiHostnameToIpv4({ hostname, internalApiUrl })
    const endpoints: ApiAllowEndpoint[] = []
    for (const ip of ips) {
        const cidr = `${ip}/32`
        if (isForbiddenKernelAllowCidr(cidr)) {
            log.error(
                { internalApiUrl, ip },
                'Refusing kernel egress ACCEPT for app API address in metadata/link-local/CGNAT/this-host range',
            )
            continue
        }
        endpoints.push({ ip, port, cidr })
    }
    if (endpoints.length === 0) {
        throw new EgressNetnsError(
            `internalApiUrl "${internalApiUrl}" resolved to no usable IPv4 address for STRICT egress ` +
            `(got: ${ips.join(', ') || 'none'}). Use a reachable IPv4 API URL / AP_FRONTEND_URL, or ensure DNS returns A records.`,
        )
    }
    const fingerprint = [...new Set(endpoints.map((endpoint) => `${endpoint.ip}:${endpoint.port}`))].sort().join(',')
    return {
        endpoints,
        // An address literal needs no pin — the box dials it directly and there is nothing to resolve.
        pinHostname: isNil(parseIpv4Cidr(hostname)) ? hostname : null,
        fingerprint,
    }
}

async function resolveApiHostnameToIpv4({ hostname, internalApiUrl }: { hostname: string, internalApiUrl: string }): Promise<string[]> {
    if (!isNil(parseIpv4Cidr(hostname))) {
        return [hostname]
    }
    // Only v6 needs rejecting here: the URL host parser already rejects an out-of-range dotted quad.
    if (hostname.includes(':')) {
        throw new EgressNetnsError(
            `internalApiUrl "${internalApiUrl}" host "${hostname}" is not a usable IPv4 address for STRICT egress.`,
        )
    }
    const { data: entries, error } = await tryCatch(() => dns.promises.lookup(hostname, { all: true, family: 4 }))
    if (error || isNil(entries) || entries.length === 0) {
        throw new ApiDnsLookupError(
            `cannot resolve internalApiUrl host "${hostname}" to IPv4 for STRICT egress. ` +
            `Fix DNS or AP_FRONTEND_URL. ${error?.message ?? 'no A records'}`,
        )
    }
    return [...new Set(entries.map((entry) => entry.address))]
}

function isLoopbackHostname(hostname: string): boolean {
    const host = hostname.replace(/^\[|\]$/g, '')
    return host === 'localhost' || host === '::1' || host.startsWith('127.')
}

function toKernelAllowCidrs({ allowList, log }: { allowList: string[], log: SandboxLogger }): string[] {
    const cidrs: string[] = []
    for (const raw of allowList) {
        const entry = raw.trim()
        if (entry === '') {
            continue
        }
        if (isHostnameAllowEntry(entry)) {
            // Drop, don't throw: a hostname has no static iptables -d rule, and throwing would idle the worker.
            log.error(
                { allowEntry: entry },
                'Dropping AP_SSRF_ALLOW_LIST hostname from kernel egress rules — STRICT accepts only IPv4 literals/CIDRs; the box cannot reach this host by name under STRICT',
            )
            continue
        }
        const cidr = parseIpv4Cidr(entry)
        if (isNil(cidr)) {
            log.warn({ allowEntry: entry }, 'Dropping AP_SSRF_ALLOW_LIST entry from kernel egress rules (not a valid IPv4 literal/CIDR)')
            continue
        }
        if (isForbiddenKernelAllowCidr(cidr)) {
            log.error(
                { allowEntry: entry, cidr },
                'Refusing kernel egress ACCEPT for metadata/link-local/CGNAT/this-host range (overlaps 169.254.0.0/16, 100.64.0.0/10, or 0.0.0.0/8); dropping entry',
            )
            continue
        }
        cidrs.push(cidr)
    }
    return [...new Set(cidrs)]
}

function isHostnameAllowEntry(entry: string): boolean {
    if (entry.includes(':')) {
        return false
    }
    return /[a-zA-Z_]/.test(entry)
}

function isForbiddenKernelAllowCidr(cidr: string): boolean {
    const range = cidrToRange(cidr)
    if (isNil(range)) {
        return true
    }
    return FORBIDDEN_KERNEL_ALLOW_CIDRS.some((denied) => {
        const deniedRange = cidrToRange(denied)
        return !isNil(deniedRange) && rangesOverlap(range, deniedRange)
    })
}

function parseIpv4Cidr(entry: string): string | null {
    const [ip, prefix, ...rest] = entry.trim().split('/')
    if (rest.length > 0) {
        return null
    }
    const octets = ip.split('.')
    if (octets.length !== 4 || !octets.every(isByte)) {
        return null
    }
    if (isNil(prefix)) {
        return `${ip}/32`
    }
    const bits = Number(prefix)
    if (!Number.isInteger(bits) || bits < 0 || bits > 32) {
        return null
    }
    return `${ip}/${bits}`
}

function isByte(part: string): boolean {
    if (!/^\d{1,3}$/.test(part)) {
        return false
    }
    const value = Number(part)
    return value >= 0 && value <= 255
}

function defaultPortForProtocol(protocol: string): number {
    return protocol === 'https:' ? 443 : 80
}

function resolveEgressBaseSubnet(): EgressBaseSubnet {
    const raw = process.env['AP_SANDBOX_EGRESS_SUBNET']?.trim()
    if (isNil(raw) || raw === '') {
        return DEFAULT_EGRESS_SUBNET
    }
    const parsed = parseSlash16(raw)
    if (isNil(parsed)) {
        throw new EgressNetnsError(`AP_SANDBOX_EGRESS_SUBNET must be an IPv4 /16 like "10.255.0.0/16", got "${raw}"`)
    }
    return parsed
}

function parseSlash16(raw: string): EgressBaseSubnet | null {
    const [network, prefix] = raw.split('/')
    if (prefix !== '16') {
        return null
    }
    const octets = network.split('.')
    if (octets.length !== 4 || !octets.every(isByte) || octets[2] !== '0' || octets[3] !== '0') {
        return null
    }
    return { prefix: `${octets[0]}.${octets[1]}`, cidr: raw }
}

async function assertNoSubnetOverlap({ log, base }: { log: SandboxLogger, base: EgressBaseSubnet }): Promise<void> {
    // Only a host network INSIDE the pool conflicts; a summary route containing it loses to our /30s.
    if (overlapChecked) {
        return
    }
    const { data: inventory, error } = await tryCatch(() => listHostInventory())
    if (!isNil(error) || isNil(inventory)) {
        throw new EgressNetnsError(
            'cannot inventory host IPv4 addresses/routes to check egress subnet overlap; failing closed rather than risking a silent VPC collision. ' +
            `${error?.message ?? 'ip addr/route returned no data'}`,
        )
    }
    const ours = cidrToRange(base.cidr)
    // Two ways in: a CIDR subset of the pool, or a bare address (next-hop, or a mask wider than /16).
    const cidrClash = isNil(ours) ? undefined : inventory.cidrs.find((cidr) => {
        const range = cidrToRange(cidr)
        return !isNil(range) && isRangeWithin({ inner: range, outer: ours })
    })
    const addressClash = isNil(ours) ? undefined : inventory.addresses.find((ip) => {
        const value = ipv4ToInt(ip)
        return !isNil(value) && value >= ours[0] && value <= ours[1]
    })
    const clash = cidrClash ?? addressClash
    if (!isNil(clash)) {
        throw new EgressNetnsError(
            `egress subnet ${base.cidr} overlaps an existing host network (${clash}) that occupies addresses inside the pool; ` +
            'the box veth /30s would collide with real host routes. Set AP_SANDBOX_EGRESS_SUBNET to a free IPv4 /16.',
        )
    }
    overlapChecked = true
    log.debug({ egressSubnet: base.cidr }, 'Egress subnet does not overlap host networks')
}

function isRangeWithin({ inner, outer }: { inner: [number, number], outer: [number, number] }): boolean {
    return inner[0] >= outer[0] && inner[1] <= outer[1]
}

// Warn only: node-level bridges suggest the rules land on the NODE's tables, but docker0 is legitimate.
async function warnOnSuspectedHostNetwork({ log }: { log: SandboxLogger }): Promise<void> {
    const linkOutput = await listCommandBestEffort({ cmd: 'ip', args: ['-o', 'link', 'show'] })
    const names = parseLinkNames(linkOutput)
    const nodeInterfaces = names.filter((name) => NODE_NETWORK_INTERFACE_PATTERNS.some((pattern) => pattern.test(name)))
    if (nodeInterfaces.length === 0) {
        return
    }
    log.warn(
        { nodeInterfaces },
        'Node-level network interfaces are visible from this worker, which suggests it shares the host/node network namespace. STRICT egress writes iptables FORWARD/INPUT/nat rules into the tables it can see, so these land on the NODE and an unclean shutdown leaves them behind. Run the worker in its own container/pod network namespace',
    )
}

function parseLinkNames(linkOutput: string): string[] {
    const names = new Set<string>()
    for (const line of linkOutput.split('\n')) {
        const match = line.match(/^\d+:\s*([^:@\s]+)/)
        if (match) {
            names.add(match[1])
        }
    }
    return [...names]
}

// Memoizes the PROMISE, so N boxes starting at once do not each spawn the discovery commands.
function resolveUplinkMtu({ log }: { log: SandboxLogger }): Promise<number | null> {
    uplinkMtuPromise = uplinkMtuPromise ?? discoverUplinkMtu({ log })
    return uplinkMtuPromise
}

async function discoverUplinkMtu({ log }: { log: SandboxLogger }): Promise<number | null> {
    const routeOutput = await listCommandBestEffort({ cmd: 'ip', args: ['-o', '-4', 'route', 'show', 'default'] })
    const devices = parseDefaultRouteDevices(routeOutput)
    if (devices.length === 0) {
        log.warn({}, 'No IPv4 default-route device found; leaving the box veth at the kernel default MTU. Large uploads from a sandbox may blackhole if the real uplink MTU is below 1500')
        return null
    }
    const mtus: number[] = []
    for (const device of devices) {
        const linkOutput = await listCommandBestEffort({ cmd: 'ip', args: ['-o', 'link', 'show', 'dev', device] })
        const mtu = parseLinkMtu(linkOutput)
        if (!isNil(mtu)) {
            mtus.push(mtu)
        }
    }
    // Smallest wins across ECMP uplinks: too-small only costs throughput, too-large blackholes.
    const smallest = mtus.length === 0 ? null : Math.min(...mtus)
    if (isNil(smallest) || smallest < MIN_VETH_MTU) {
        log.warn({ uplinkDevices: devices, discoveredMtu: smallest }, 'Could not read a usable uplink MTU; leaving the box veth at the kernel default MTU. Large uploads from a sandbox may blackhole if the real uplink MTU is below 1500')
        return null
    }
    // Lower only: raising it above 1500 would make the box depend on PMTUD, which is the blackhole this removes.
    const mtu = Math.min(smallest, DEFAULT_VETH_MTU)
    if (mtu === DEFAULT_VETH_MTU) {
        log.debug({ uplinkDevices: devices, discoveredMtu: smallest }, 'Uplink MTU is at or above the standard 1500; leaving the box veth at the default')
        return null
    }
    log.info({ uplinkDevices: devices, mtu }, 'Lowering the box veth MTU to match the uplink')
    return mtu
}

function parseDefaultRouteDevices(routeOutput: string): string[] {
    const devices = new Set<string>()
    for (const line of routeOutput.split('\n')) {
        if (!/^default\b/.test(line.trim())) {
            continue
        }
        // ECMP renders as one line whose devices live only in `nexthop ... dev X`, so collect every match.
        for (const match of line.matchAll(/\bdev\s+(\S+)/g)) {
            if (isValidInterfaceName(match[1]) && !match[1].startsWith('ap-veth-')) {
                devices.add(match[1])
            }
        }
    }
    return [...devices]
}

// IFNAMSIZ-bounded, and it keeps a malformed route parse from handing `ip` a token that reads as an option.
function isValidInterfaceName(name: string): boolean {
    return /^[A-Za-z0-9_.:@-]{1,15}$/.test(name) && !name.startsWith('-')
}

function parseLinkMtu(linkOutput: string): number | null {
    const match = linkOutput.match(/\bmtu\s+(\d+)\b/)
    if (isNil(match)) {
        return null
    }
    const mtu = Number(match[1])
    return Number.isInteger(mtu) && mtu > 0 ? mtu : null
}

async function listHostInventory(): Promise<{ cidrs: string[], addresses: string[] }> {
    const addr = await spawnWithKill({ cmd: 'ip', args: ['-o', '-4', 'addr', 'show'], timeoutMs: COMMAND_TIMEOUT_MS })
    const route = await spawnWithKill({ cmd: 'ip', args: ['-o', '-4', 'route', 'show'], timeoutMs: COMMAND_TIMEOUT_MS })
    return {
        cidrs: parseHostCidrs({ addrOutput: addr.stdout, routeOutput: route.stdout }),
        addresses: parseHostAddresses({ addrOutput: addr.stdout, routeOutput: route.stdout }),
    }
}

function parseHostAddresses({ addrOutput, routeOutput }: { addrOutput: string, routeOutput: string }): string[] {
    const addresses = new Set<string>()
    for (const line of addrOutput.split('\n')) {
        if (/\bap-veth-/.test(line)) {
            continue
        }
        // The unmasked address: a wide mask hides it from the subset-CIDR test though it sits in the pool.
        const match = line.match(/\binet\s+(\d+\.\d+\.\d+\.\d+)\/\d+/)
        if (match) {
            addresses.add(match[1])
        }
    }
    for (const line of routeOutput.split('\n')) {
        if (/\bdev\s+ap-veth-/.test(line)) {
            continue
        }
        // Route next-hops: a gateway inside the pool that the leading-CIDR route parse never sees.
        const match = line.match(/\bvia\s+(\d+\.\d+\.\d+\.\d+)/)
        if (match) {
            addresses.add(match[1])
        }
    }
    return [...addresses]
}

function parseHostCidrs({ addrOutput, routeOutput }: { addrOutput: string, routeOutput: string }): string[] {
    const cidrs = new Set<string>()
    for (const line of addrOutput.split('\n')) {
        // ap-veth-* are our own gateway addresses — exclude them so a stale veth never self-flags.
        if (/\bap-veth-/.test(line)) {
            continue
        }
        const match = line.match(/\binet\s+(\d+\.\d+\.\d+\.\d+\/\d+)/)
        if (match) {
            cidrs.add(match[1])
        }
    }
    for (const line of routeOutput.split('\n')) {
        if (/\bdev\s+ap-veth-/.test(line)) {
            continue
        }
        const match = line.match(/^(\d+\.\d+\.\d+\.\d+\/\d+)\b/)
        if (match) {
            cidrs.add(match[1])
        }
    }
    return [...cidrs]
}

function cidrToRange(cidr: string): [number, number] | null {
    const [ip, prefix] = cidr.split('/')
    const start = ipv4ToInt(ip)
    const bits = Number(prefix)
    if (isNil(start) || !Number.isInteger(bits) || bits < 0 || bits > 32) {
        return null
    }
    const size = 2 ** (32 - bits)
    const network = Math.floor(start / size) * size
    return [network, network + size - 1]
}

function ipv4ToInt(ip: string): number | null {
    const octets = ip.split('.')
    if (octets.length !== 4 || !octets.every(isByte)) {
        return null
    }
    return octets.reduce((acc, octet) => acc * 256 + Number(octet), 0)
}

function rangesOverlap(a: [number, number], b: [number, number]): boolean {
    return a[0] <= b[1] && b[0] <= a[1]
}

export async function assertEgressCapabilities(): Promise<void> {
    // EXERCISES the privileged ops: a binary-presence check passes without CAP_NET_ADMIN, then fails every job.
    await assertToolingAvailable()
    await assertCanCreateNamespace()
    await assertCanEditIptables()
}

async function assertToolingAvailable(): Promise<void> {
    await assertBinaryAvailable({ binary: 'ip' })
    await assertBinaryAvailable({ binary: 'iptables' })
    await assertBinaryAvailable({ binary: 'ip6tables' })
    await assertIpForwardingEnabled()
}

async function assertCanCreateNamespace(): Promise<void> {
    // Unique per probe, deleted only if we created it; exec is probed separately because it remounts sysfs.
    const probeNetns = `ap-egress-probe-${createProbeSuffix()}`
    const { error } = await tryCatch(() => runCommand({ binary: 'ip', args: ['netns', 'add', probeNetns] }))
    if (error) {
        throw new EgressNetnsError(
            'cannot create a network namespace — STRICT egress needs CAP_NET_ADMIN + CAP_SYS_ADMIN ' +
            `(the privileged sandbox container grants these). ${error.message}`,
        )
    }
    const { error: execError } = await tryCatch(() => runCommand({ binary: 'ip', args: ['netns', 'exec', probeNetns, 'true'] }))
    if (execError) {
        await tryCatch(() => runCommand({ binary: 'ip', args: ['netns', 'del', probeNetns] }))
        throw new EgressNetnsError(
            `cannot exec into a network namespace (ip netns exec) — STRICT job spawn requires this. ${execError.message}`,
        )
    }
    const { error: cleanupError } = await tryCatch(() => runCommand({ binary: 'ip', args: ['netns', 'del', probeNetns] }))
    if (cleanupError) {
        throw new EgressNetnsError(`cannot delete capability-probe namespace ${probeNetns}. ${cleanupError.message}`)
    }
}

async function assertCanEditIptables(): Promise<void> {
    // The real RULE SHAPES: a kernel missing xt_conntrack or ipt_REJECT passes a bare chain-create.
    await probeChainShapes({
        binary: 'iptables',
        label: 'filter',
        rules: [
            ['-m', 'conntrack', '--ctstate', 'ESTABLISHED', '-j', 'ACCEPT'],
            ['-p', 'icmp', '-m', 'conntrack', '--ctstate', 'RELATED', '-j', 'ACCEPT'],
            ['-d', '192.0.2.1/32', '-j', 'REJECT', '--reject-with', 'icmp-host-prohibited'],
            ['-d', '192.0.2.1/32', '-p', 'tcp', '--dport', '443', '-j', 'ACCEPT'],
        ],
    })
    await assertCanMasquerade()
    await probeChainShapes({
        binary: 'ip6tables',
        label: 'ip6 filter',
        rules: [['-j', 'DROP']],
    })
}

async function assertCanMasquerade(): Promise<void> {
    // MASQUERADE is hook-bound under iptables-nft, so a user chain would false-fail on a healthy host.
    const rule = ['-s', '192.0.2.0/30', '!', '-o', 'lo', '-j', 'MASQUERADE']
    const { error } = await tryCatch(() => runCommand({ binary: 'iptables', args: ['-t', 'nat', '-I', 'POSTROUTING', '1', ...rule] }))
    if (error) {
        throw new EgressNetnsError(`cannot install a nat POSTROUTING MASQUERADE rule — STRICT egress needs CAP_NET_ADMIN and nf_nat/MASQUERADE loaded. ${error.message}`)
    }
    const { error: deleteError } = await tryCatch(() => runCommand({ binary: 'iptables', args: ['-t', 'nat', '-D', 'POSTROUTING', ...rule] }))
    if (deleteError) {
        throw new EgressNetnsError(`cannot remove the nat POSTROUTING MASQUERADE probe rule. ${deleteError.message}`)
    }
}

async function probeChainShapes({ binary, label, rules }: { binary: 'iptables' | 'ip6tables', label: string, rules: string[][] }): Promise<void> {
    const chain = `AP_EG_P_${createProbeSuffix()}`.slice(0, IPTABLES_CHAIN_NAME_MAX_LENGTH)
    const { error: createError } = await tryCatch(() => runCommand({ binary, args: ['-N', chain] }))
    if (createError) {
        throw new EgressNetnsError(`cannot create an iptables ${label} chain — STRICT egress needs CAP_NET_ADMIN and a loaded ${label} backend. ${createError.message}`)
    }
    for (const rule of rules) {
        const { error: appendError } = await tryCatch(() => runCommand({ binary, args: ['-A', chain, ...rule] }))
        if (appendError) {
            await tryCatch(() => runCommand({ binary, args: ['-F', chain] }))
            await tryCatch(() => runCommand({ binary, args: ['-X', chain] }))
            throw new EgressNetnsError(`cannot append the ${label} rule "${rule.join(' ')}" — a required kernel module (conntrack / REJECT / ip6tables) is missing. ${appendError.message}`)
        }
    }
    const { error: flushError } = await tryCatch(() => runCommand({ binary, args: ['-F', chain] }))
    const { error: deleteError } = await tryCatch(() => runCommand({ binary, args: ['-X', chain] }))
    if (flushError || deleteError) {
        throw new EgressNetnsError(`cannot clean up the ${label} probe chain ${chain}. ${(flushError ?? deleteError)?.message ?? ''}`)
    }
}

function createProbeSuffix(): string {
    return `${process.pid.toString(36)}-${randomBytes(4).toString('hex')}`
}

function listenOnAbstractSocket({ server, socketName }: { server: NetServer, socketName: string }): Promise<void> {
    return new Promise((resolve, reject) => {
        const onError = (error: Error): void => {
            server.removeListener('listening', onListening)
            reject(error)
        }
        const onListening = (): void => {
            server.removeListener('error', onError)
            resolve()
        }
        server.once('error', onError)
        server.once('listening', onListening)
        server.listen(socketName)
    })
}

function closeNetServer(server: NetServer): Promise<void> {
    if (!server.listening) {
        return Promise.resolve()
    }
    return new Promise((resolve, reject) => {
        server.close((error) => {
            if (error) {
                reject(error)
                return
            }
            resolve()
        })
    })
}

async function assertBinaryAvailable({ binary }: { binary: string }): Promise<void> {
    const versionFlag = binary === 'ip' ? '-V' : '--version'
    const { error } = await tryCatch(() => spawnWithKill({ cmd: binary, args: [versionFlag], timeoutMs: COMMAND_TIMEOUT_MS }))
    if (error) {
        throw new EgressNetnsError(
            `"${binary}" binary not available. Install ${binary === 'ip' ? 'iproute2' : binary} in the worker image ` +
            `for network-namespace egress isolation in STRICT mode. ${error.message}`,
        )
    }
}

function buildTopology(boxId: number, base: EgressBaseSubnet = DEFAULT_EGRESS_SUBNET): NetnsTopology {
    // Per-box /30 from base/16: network = boxId*4, gateway = +1 (host, WS-RPC), box = +2 (in the netns).
    const offset = boxId * 4
    if (offset + 3 > 0xffff) {
        throw new EgressNetnsError(`boxId ${boxId} is too large for the ${base.cidr} egress pool`)
    }
    const octet = (value: number): string => `${base.prefix}.${Math.floor(value / 256)}.${value % 256}`
    return {
        boxId,
        netnsName: `ap-egress-${boxId}`,
        vethHost: `ap-veth-h${boxId}`,
        vethBox: `ap-veth-b${boxId}`,
        subnetCidr: `${octet(offset)}/30`,
        poolCidr: base.cidr,
        gatewayHost: octet(offset + 1),
        boxHost: octet(offset + 2),
        chain: `AP_EG_FWD_${boxId}`,
        inChain: `AP_EG_IN_${boxId}`,
        rpcPort: sandboxCapacity.wsRpcPortForBox(boxId),
    }
}

function buildCreateCommands(t: NetnsTopology, options: BuildCreateOptions = {}): NetnsCommand[] {
    const { callbackPort, allowCidrs = [], apiAllowEndpoints = [], mtu } = options
    const ip = (...args: string[]): NetnsCommand => ({ binary: 'ip', args })
    const iptables = (...args: string[]): NetnsCommand => ({ binary: 'iptables', args })
    return [
        ip('netns', 'add', t.netnsName),
        ip('link', 'add', t.vethHost, 'type', 'veth', 'peer', 'name', t.vethBox),
        ip('link', 'set', t.vethBox, 'netns', t.netnsName),
        ip('addr', 'add', `${t.gatewayHost}/30`, 'dev', t.vethHost),
        ip('netns', 'exec', t.netnsName, 'ip', 'addr', 'add', `${t.boxHost}/30`, 'dev', t.vethBox),
        ip('link', 'set', t.vethHost, 'addrgenmode', 'none'),
        ip('netns', 'exec', t.netnsName, 'ip', 'link', 'set', t.vethBox, 'addrgenmode', 'none'),
        ...(isNil(mtu) ? [] : [
            ip('link', 'set', t.vethHost, 'mtu', String(mtu)),
            ip('netns', 'exec', t.netnsName, 'ip', 'link', 'set', t.vethBox, 'mtu', String(mtu)),
        ]),
        iptables('-t', 'nat', '-I', 'POSTROUTING', '1', '-s', t.subnetCidr, '!', '-o', t.vethHost, '-j', 'MASQUERADE'),
        iptables('-N', t.chain),
        iptables('-A', t.chain, '-d', t.poolCidr, '-j', 'REJECT', '--reject-with', 'icmp-host-prohibited'),
        ...allowCidrs.map((cidr) => iptables('-A', t.chain, '-d', cidr, '-j', 'ACCEPT')),
        ...apiAllowEndpoints.map((endpoint) => iptables(
            '-A', t.chain, '-d', endpoint.cidr, '-p', 'tcp', '--dport', String(endpoint.port), '-j', 'ACCEPT',
        )),
        ...BLOCKED_CIDRS.map((cidr) => iptables('-A', t.chain, '-d', cidr, '-j', 'REJECT', '--reject-with', 'icmp-host-prohibited')),
        iptables('-A', t.chain, '-j', 'ACCEPT'),
        iptables('-I', 'FORWARD', '1', '-i', t.vethHost, '!', '-s', t.subnetCidr, '-j', 'DROP'),
        iptables('-I', 'FORWARD', '1', '-o', t.vethHost, '-p', 'icmp', '-m', 'conntrack', '--ctstate', 'RELATED', '-j', 'ACCEPT'),
        iptables('-I', 'FORWARD', '1', '-o', t.vethHost, '-m', 'conntrack', '--ctstate', 'ESTABLISHED', '-j', 'ACCEPT'),
        iptables('-I', 'FORWARD', '1', '-i', t.vethHost, '-s', t.subnetCidr, '-j', t.chain),
        iptables('-N', t.inChain),
        iptables('-A', t.inChain, '-d', t.gatewayHost, '-p', 'tcp', '--dport', String(t.rpcPort), '-j', 'ACCEPT'),
        ...(isNil(callbackPort) ? [] : [iptables('-A', t.inChain, '-d', t.gatewayHost, '-p', 'tcp', '--dport', String(callbackPort), '-j', 'ACCEPT')]),
        iptables('-A', t.inChain, '-j', 'DROP'),
        iptables('-I', 'INPUT', '1', '-i', t.vethHost, '-j', t.inChain),
        iptables('-I', 'INPUT', '1', '!', '-i', t.vethHost, '-d', t.gatewayHost, '-j', 'DROP'),
        ip('netns', 'exec', t.netnsName, 'ip6tables', '-A', 'OUTPUT', '-j', 'DROP'),
        ip('link', 'set', t.vethHost, 'up'),
        ip('netns', 'exec', t.netnsName, 'ip', 'link', 'set', t.vethBox, 'up'),
        ip('netns', 'exec', t.netnsName, 'ip', 'link', 'set', 'lo', 'up'),
        ip('netns', 'exec', t.netnsName, 'ip', 'route', 'add', 'default', 'via', t.gatewayHost),
    ]
}

function buildSeverCommands(t: NetnsTopology): NetnsCommand[] {
    const ip = (...args: string[]): NetnsCommand => ({ binary: 'ip', args })
    // Any one of these succeeding means the box can no longer forward: no interface, or no namespace.
    return [
        ip('link', 'set', t.vethHost, 'down'),
        ip('netns', 'del', t.netnsName),
        ip('link', 'del', t.vethHost),
    ]
}

function buildFilterCleanupCommands(t: NetnsTopology): NetnsCommand[] {
    const iptables = (...args: string[]): NetnsCommand => ({ binary: 'iptables', args })
    return [
        iptables('-D', 'INPUT', '!', '-i', t.vethHost, '-d', t.gatewayHost, '-j', 'DROP'),
        iptables('-D', 'INPUT', '-i', t.vethHost, '-j', t.inChain),
        iptables('-F', t.inChain),
        iptables('-X', t.inChain),
        iptables('-D', 'FORWARD', '-i', t.vethHost, '-s', t.subnetCidr, '-j', t.chain),
        iptables('-D', 'FORWARD', '-o', t.vethHost, '-m', 'conntrack', '--ctstate', 'ESTABLISHED', '-j', 'ACCEPT'),
        iptables('-D', 'FORWARD', '-o', t.vethHost, '-p', 'icmp', '-m', 'conntrack', '--ctstate', 'RELATED', '-j', 'ACCEPT'),
        iptables('-D', 'FORWARD', '-i', t.vethHost, '!', '-s', t.subnetCidr, '-j', 'DROP'),
        iptables('-F', t.chain),
        iptables('-X', t.chain),
        iptables('-t', 'nat', '-D', 'POSTROUTING', '-s', t.subnetCidr, '!', '-o', t.vethHost, '-j', 'MASQUERADE'),
    ]
}

function buildDestroyCommands(t: NetnsTopology): NetnsCommand[] {
    return [...buildSeverCommands(t), ...buildFilterCleanupCommands(t)]
}

export class EgressNetnsError extends Error {
    constructor(message: string) {
        super(message)
        this.name = 'EgressNetnsError'
    }
}

// Distinct from its parent so the cached resolver can tell a transient lookup failure from a permanent one.
export class ApiDnsLookupError extends EgressNetnsError {
    constructor(message: string) {
        super(message)
        this.name = 'ApiDnsLookupError'
    }
}

// Interfaces a container cannot normally see from its own netns, so they hint at a root netns.
const NODE_NETWORK_INTERFACE_PATTERNS: readonly RegExp[] = [
    /^docker0$/,
    /^cni0$/,
    /^flannel/,
    /^kube-ipvs0$/,
    /^cilium_host$/,
    /^br-[0-9a-f]{12}$/,
]

// Allow-list ACCEPTs sit above BLOCKED_CIDRS, so these must never be punched through. RFC1918 still can be.
const FORBIDDEN_KERNEL_ALLOW_CIDRS: readonly string[] = [
    '169.254.0.0/16',
    '100.64.0.0/10',
    '0.0.0.0/8',
]

// Must agree with ssrfIpClassifier, which a parity test in netns.test.ts asserts; v6 is dropped wholesale.
const BLOCKED_CIDRS: readonly string[] = [
    '0.0.0.0/8',        // "this host" / current network — 0.0.0.0 can alias localhost on Linux
    '10.0.0.0/8',       // RFC1918 private
    '100.64.0.0/10',    // CGNAT (RFC6598), incl. Alibaba metadata 100.100.100.200
    '127.0.0.0/8',      // IPv4 loopback
    '169.254.0.0/16',   // link-local, incl. cloud metadata (169.254.169.254) and ECS creds (169.254.170.2)
    '172.16.0.0/12',    // RFC1918 private
    '192.0.0.0/24',     // IETF protocol assignments (RFC6890)
    '192.0.2.0/24',     // TEST-NET-1 (documentation)
    '192.88.99.0/24',   // 6to4 relay anycast (RFC3068)
    '192.168.0.0/16',   // RFC1918 private
    '198.18.0.0/15',    // benchmarking (RFC2544)
    '198.51.100.0/24',  // TEST-NET-2 (documentation)
    '203.0.113.0/24',   // TEST-NET-3 (documentation)
    '224.0.0.0/4',      // multicast (class D)
    '240.0.0.0/4',      // reserved / "future use", incl. 255.255.255.255 limited broadcast
]

export const egressNetnsInternals = {
    buildTopology,
    buildCreateCommands,
    buildDestroyCommands,
    serializePerBox,
    parseNetnsBoxIds,
    parseResourceBoxIds,
    resolveCallbackRewrite,
    resolveApiEgress,
    toKernelAllowCidrs,
    withXtablesWait,
    parseSlash16,
    parseHostCidrs,
    parseHostAddresses,
    parseDefaultRouteDevices,
    parseLinkMtu,
    cidrToRange,
    rangesOverlap,
    BLOCKED_CIDRS,
    resetStateForTests: (): void => {
        staleSwept = false
        overlapChecked = false
        uplinkMtuPromise = null
        boxOwners.clear()
        boxOperationLocks.clear()
        apiEgressCache.clear()
    },
}

const COMMAND_TIMEOUT_MS = 5_000

const XTABLES_WAIT_SECONDS = 3

const IPTABLES_CHAIN_NAME_MAX_LENGTH = 28

const NETNS_FREE_RETRIES = 40
const NETNS_FREE_RETRY_DELAY_MS = 300
const ORPHAN_KILL_REAP_RETRIES = 3

// Floor ignores a bogus reading that would break TLS-heavy pieces; ceiling is the veth's own default.
const MIN_VETH_MTU = 1280
const DEFAULT_VETH_MTU = 1500

const API_EGRESS_TTL_MS = 30_000
const API_EGRESS_STALE_LIMIT_MS = 600_000

const EGRESS_LEASE_SOCKET = '\0activepieces-egress-owner'

const EMPTY_API_EGRESS: ApiEgressResolution = {
    endpoints: [],
    pinHostname: null,
    fingerprint: '',
}

const boxOperationLocks = new Map<number, Promise<unknown>>()

const boxOwners = new Map<number, symbol>()

const apiEgressCache = new Map<string, CachedApiEgress>()

let staleSwept = false

let overlapChecked = false

let uplinkMtuPromise: Promise<number | null> | null = null

const DEFAULT_EGRESS_SUBNET: EgressBaseSubnet = { prefix: '10.255', cidr: '10.255.0.0/16' }

type EgressBaseSubnet = {
    prefix: string
    cidr: string
}

type NetnsCommand = {
    binary: string
    args: string[]
}

type NetnsTopology = {
    boxId: number
    netnsName: string
    vethHost: string
    vethBox: string
    subnetCidr: string
    poolCidr: string
    gatewayHost: string
    boxHost: string
    chain: string
    inChain: string
    rpcPort: number
}

type CallbackRewrite = {
    port: number
    url: string
}

type ApiAllowEndpoint = {
    ip: string
    port: number
    cidr: string
}

export type ApiEgressResolution = {
    endpoints: ApiAllowEndpoint[]
    pinHostname: string | null
    fingerprint: string
}

type CachedApiEgress = {
    resolution: ApiEgressResolution
    freshUntil: number
    staleUntil: number
}

type BuildCreateOptions = {
    callbackPort?: number
    allowCidrs?: string[]
    apiAllowEndpoints?: ApiAllowEndpoint[]
    mtu?: number | null
}

type CreateParams = {
    log: SandboxLogger
    boxId: number
    internalApiUrl?: string
    allowList?: string[]
    apiEgress?: ApiEgressResolution
}

type NetnsInspection =
    | { exists: false }
    | { exists: true, pids: string[] }

export type EgressNetworkLease = {
    release: () => Promise<void>
}

export type EgressNetns = {
    netnsName: string
    gatewayHost: string
    callbackApiUrl: string | null
    callbackPort: number | null
    apiAllow: string | null
    apiHostPin: string | null
    fingerprint: string
    destroy: () => Promise<void>
}
