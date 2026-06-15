import net from 'node:net'
import { chmod, mkdtemp, copyFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { egressNetns, EgressNetns } from '../../src/lib/egress/netns'
import { startEgressProxy, EgressProxy } from '../../src/lib/egress/proxy'
import { getIsolateExecutableName, isolateProcess } from '../../src/lib/sandbox/isolate'
import { bundleSsrfGuard } from './helpers/bundle-ssrf-guard'
import { requireIsolateBinary, requireLinuxPrivileged } from './helpers/privilege-guard'
import { silentLogger } from './helpers/silent-logger'

/**
 * Engine ssrf-guard under the real netns model. The guard (DNS/Socket hooks) is the
 * in-process line of defense; the netns is the topological one. Both must agree:
 *  - guard throws SSRFBlockedError for private/loopback/metadata before any connect
 *  - the gateway (proxy + WS-RPC) is reachable; everything else has no route at all
 */

const BOX_ID = 0
const GATEWAY_HOST = '10.255.0.1'
const ISOLATE_BINARY_PATH = path.resolve(process.cwd(), 'packages/server/api/src/assets', getIsolateExecutableName())

const skip = requireLinuxPrivileged() ?? requireIsolateBinary(ISOLATE_BINARY_PATH)

describe.skipIf(skip)('sandbox engine ssrf-guard — real hooks under netns + proxy', () => {
    let ns: EgressNetns
    let proxy: EgressProxy
    let echo: { server: net.Server, port: number }
    let wsRpcListener: { server: net.Server, port: number }
    let commonDir: string
    let probeResultsByCase: Record<string, ProbeResult> | null = null

    beforeAll(async () => {
        ns = await egressNetns.create({ log: silentLogger() })
        echo = await startGatewayTcpEcho(GATEWAY_HOST)
        wsRpcListener = await startGatewayTcpEcho(GATEWAY_HOST)
        proxy = await startEgressProxy({
            log: silentLogger(),
            host: ns.gatewayHost,
            allowList: [ns.gatewayHost],
        })

        commonDir = await mkdtemp(path.join(tmpdir(), 'ap-engine-ssrf-e2e-'))
        const probeDst = path.join(commonDir, 'engine-ssrf-probe.js')
        const bundleDst = path.join(commonDir, 'ssrf-guard-bundle.js')
        await copyFile(path.resolve(__dirname, 'fixtures/engine-ssrf-probe.js'), probeDst)
        await bundleSsrfGuard({ outfile: bundleDst })
        await chmod(commonDir, 0o755)
        await chmod(probeDst, 0o644)
        await chmod(bundleDst, 0o644)

        const plan: ProbePlanItem[] = [
            { case: 'proxy-gateway', type: 'connect-expect-ok', host: GATEWAY_HOST, port: proxy.port },
            { case: 'ws-rpc', type: 'connect-expect-ok', host: GATEWAY_HOST, port: wsRpcListener.port },
            { case: 'blocked-loopback-port', type: 'connect-expect-blocked', host: '127.0.0.1', port: echo.port },
            { case: 'blocked-private-ip', type: 'connect-expect-blocked', host: '10.0.0.1', port: 1234 },
            { case: 'dns-private-ip', type: 'dns-expect-blocked', hostname: '169.254.169.254' },
            { case: 'http-proxy-allowlisted', type: 'http-via-proxy', url: `http://${GATEWAY_HOST}:${echo.port}/ping`, expectStatus: 200 },
            { case: 'http-proxy-blocked-ip', type: 'http-via-proxy', url: 'http://169.254.169.254/latest/meta-data/', expectStatus: 403 },
            { case: 'public-ip-passes-guard', type: 'connect-expect-ok', host: '8.8.8.8', port: 65535 },
        ]

        probeResultsByCase = await runProbe({ commonDir, plan, proxyPort: proxy.port, wsRpcPort: wsRpcListener.port })
    }, 60_000)

    afterAll(async () => {
        await proxy?.close()
        await new Promise<void>((resolve) => echo?.server.close(() => resolve()))
        await new Promise<void>((resolve) => wsRpcListener?.server.close(() => resolve()))
        await ns?.destroy()
    })

    it('allows the sandbox to reach the proxy port on the gateway', () => {
        expectCaseOk('proxy-gateway')
    })

    it('allows the sandbox to reach the WS RPC port on the gateway', () => {
        expectCaseOk('ws-rpc')
    })

    it('ssrf-guard blocks non-allowlisted loopback connections before they leave', () => {
        expectCaseOk('blocked-loopback-port')
        expect(probeResultsByCase!['blocked-loopback-port']!.outcome).toBe('ssrf-blocked')
    })

    it('ssrf-guard blocks direct connect to RFC1918 addresses', () => {
        expectCaseOk('blocked-private-ip')
        expect(probeResultsByCase!['blocked-private-ip']!.outcome).toBe('ssrf-blocked')
    })

    it('ssrf-guard dns hook rejects resolved private IPs as SSRFBlockedError', () => {
        expectCaseOk('dns-private-ip')
        expect(probeResultsByCase!['dns-private-ip']!.outcome).toBe('ssrf-blocked')
    })

    it('HTTP through the proxy reaches an allowlisted target (mirrors real piece flow)', () => {
        expectCaseOk('http-proxy-allowlisted')
        expect(probeResultsByCase!['http-proxy-allowlisted']!.outcome).toBe('status:200')
    })

    it('HTTP through the proxy to a blocked IP is rejected with 403 at the proxy', () => {
        expectCaseOk('http-proxy-blocked-ip')
        expect(probeResultsByCase!['http-proxy-blocked-ip']!.outcome).toBe('status:403')
    })

    it('ssrf-guard does NOT interfere with public unicast IPs (blocked only by routing, not the guard)', () => {
        const r = probeResultsByCase!['public-ip-passes-guard']!
        expect(r.outcome === 'ssrf-blocked').toBe(false)
    })

    function expectCaseOk(caseName: string): void {
        const r = probeResultsByCase?.[caseName]
        if (!r) throw new Error(`probe did not emit result for case "${caseName}"; results=${JSON.stringify(probeResultsByCase)}`)
        expect(r.ok, `case "${caseName}" outcome=${r.outcome} error=${r.error ?? ''}`).toBe(true)
    }
})

async function startGatewayTcpEcho(host: string): Promise<{ server: net.Server, port: number }> {
    const server = net.createServer((socket) => {
        socket.on('data', (chunk) => socket.write(chunk))
        socket.on('error', () => socket.destroy())
    })
    await new Promise<void>((resolve) => server.listen(0, host, () => resolve()))
    const address = server.address()
    if (typeof address !== 'object' || address === null) throw new Error('could not determine gateway echo port')
    return { server, port: address.port }
}

async function runProbe({ commonDir, plan, proxyPort, wsRpcPort }: {
    commonDir: string
    plan: ProbePlanItem[]
    proxyPort: number
    wsRpcPort: number
}): Promise<Record<string, ProbeResult>> {
    const logger = silentLogger()
    const maker = isolateProcess(logger, path.join(commonDir, 'engine-ssrf-probe.js'), commonDir, BOX_ID, 'ap-egress')

    const child = await maker.create({
        sandboxId: 'e2e-engine-ssrf',
        command: [],
        mounts: [
            { hostPath: commonDir, sandboxPath: '/root/common' },
        ],
        env: {
            HOME: '/tmp/',
            NODE_PATH: '/usr/src/node_modules',
            AP_EXECUTION_MODE: 'SANDBOX_PROCESS',
            AP_SANDBOX_WS_PORT: String(wsRpcPort),
            AP_SANDBOX_WS_HOST: GATEWAY_HOST,
            AP_SANDBOX_WS_TOKEN: 'e2e-token-aaaaaaaaaaaaaaaaaaaaaaaa',
            AP_BASE_CODE_DIRECTORY: '/root/codes',
            SANDBOX_ID: 'e2e-engine-ssrf',
            AP_NETWORK_MODE: 'STRICT',
            // Engine's socket-connect-guard must permit the private gateway IP (proxy + RPC).
            AP_SSRF_ALLOW_LIST: GATEWAY_HOST,
            AP_EGRESS_PROXY_URL: `http://${GATEWAY_HOST}:${proxyPort}`,
            AP_PROBE_PLAN: JSON.stringify(plan),
        },
        resourceLimits: { memoryLimitMb: 256, cpuMsPerSec: 1000, timeLimitSeconds: 30 },
    })

    const stdoutChunks: Buffer[] = []
    const stderrChunks: Buffer[] = []
    child.stdout?.removeAllListeners('data')
    child.stderr?.removeAllListeners('data')
    child.stdout?.on('data', (d: Buffer) => stdoutChunks.push(d))
    child.stderr?.on('data', (d: Buffer) => stderrChunks.push(d))

    const exitCode = await new Promise<number | null>((resolve) => child.on('close', (code) => resolve(code)))
    const out = Buffer.concat(stdoutChunks).toString().trim()
    const err = Buffer.concat(stderrChunks).toString().trim()
    const jsonLine = out.split('\n').reverse().find((line) => line.trim().startsWith('{'))
    if (!jsonLine) throw new Error(`probe emitted no JSON (exit=${exitCode}). stdout="${out}" stderr="${err}"`)
    const parsed = JSON.parse(jsonLine) as { results?: ProbeResult[], fatal?: string, guardEnabled?: boolean }
    if (parsed.fatal) throw new Error(`probe fatal: ${parsed.fatal}`)
    if (!parsed.guardEnabled) throw new Error('ssrf-guard did not install inside the sandbox')
    const byCase: Record<string, ProbeResult> = {}
    for (const r of parsed.results ?? []) byCase[r.case] = r
    return byCase
}

type ProbePlanItem =
    | { case: string, type: 'connect-expect-ok' | 'connect-expect-blocked', host: string, port: number }
    | { case: string, type: 'dns-expect-blocked', hostname: string }
    | { case: string, type: 'http-via-proxy', url: string, expectStatus: number }

type ProbeResult = {
    case: string
    ok: boolean
    outcome?: string
    error?: string
    body?: string
}
