import { ChildProcess } from 'node:child_process'
import { appendFile, chmod, copyFile, mkdtemp, readFile, writeFile } from 'node:fs/promises'
import http from 'node:http'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { egressNetns, EgressNetns } from '../../src/lib/egress/netns'
import { EgressProxy, startEgressProxy } from '../../src/lib/egress/proxy'
import { getIsolateExecutableName, isolateProcess } from '../../src/lib/sandbox/isolate'
import { requireIsolateBinary, requireLinuxPrivileged } from './helpers/privilege-guard'
import { silentLogger } from './helpers/silent-logger'

/**
 * SSRF-completeness, all connectivity-INDEPENDENT (no internet needed; runs in every CI):
 *  - #6 EAI_AGAIN guard: an HTTP GET BY HOSTNAME through the proxy succeeds — the proxy
 *    resolves the name (the sandbox has no resolver of its own), proving the "no own DNS /
 *    no EAI_AGAIN" guarantee against a local gateway origin.
 *  - #7 plain http:// forward (GET-forward, not CONNECT) reaches an allowlisted origin → 200.
 *  - #8 non-HTTP fail-closed: a raw TCP connect to an allowlisted EXTERNAL host (not the
 *    gateway) has no route — documents that only proxy-tunnelable traffic egresses.
 */

const BOX_ID = 0
const GATEWAY_HOST = '10.255.0.1'
const ORIGIN_HOSTNAME = 'ap-egress-origin.test'
const HOSTS_FILE = '/etc/hosts'
const HOSTS_MARKER = `${GATEWAY_HOST} ${ORIGIN_HOSTNAME}\n`
const ISOLATE_BINARY_PATH = path.resolve(process.cwd(), 'packages/server/api/src/assets', getIsolateExecutableName())

const skip = requireLinuxPrivileged() ?? requireIsolateBinary(ISOLATE_BINARY_PATH)

describe.skipIf(skip)('sandbox egress completeness — no-DNS / forward / non-HTTP fail-closed', () => {
    let ns: EgressNetns
    let proxy: EgressProxy
    let gatewayEcho: { server: http.Server, port: number }
    let commonDir: string
    let originalHosts: string | null = null

    beforeAll(async () => {
        ns = await egressNetns.create({ log: silentLogger() })
        gatewayEcho = await startGatewayHttpEcho(GATEWAY_HOST)

        // Make ORIGIN_HOSTNAME resolve to the gateway on the WORKER host so the proxy's own
        // dns.lookup can resolve it without any internet. The sandbox never resolves anything.
        originalHosts = await readHostsOrNull()
        await appendFile(HOSTS_FILE, HOSTS_MARKER)

        proxy = await startEgressProxy({
            log: silentLogger(),
            host: ns.gatewayHost,
            // Allow the gateway IP so the resolved-to-gateway origin passes the SSRF classifier.
            allowList: [ns.gatewayHost],
        })

        commonDir = await mkdtemp(path.join(tmpdir(), 'ap-egress-completeness-'))
        const probeDst = path.join(commonDir, 'egress-probe.js')
        await copyFile(path.resolve(__dirname, 'fixtures/egress-probe.js'), probeDst)
        await chmod(commonDir, 0o755)
        await chmod(probeDst, 0o644)
    }, 60_000)

    afterAll(async () => {
        await proxy?.close()
        await new Promise<void>((resolve) => gatewayEcho?.server.close(() => resolve()))
        await ns?.destroy()
        if (originalHosts !== null) await writeFile(HOSTS_FILE, originalHosts)
    })

    it('#6 HTTP GET BY HOSTNAME through the proxy succeeds (proxy resolves; sandbox has no resolver)', async () => {
        const result = await runProbeInNetns({
            plan: [{ type: 'http-get-via-proxy', url: `http://${ORIGIN_HOSTNAME}:${gatewayEcho.port}/by-hostname` }],
        })
        expect(result.results[0]).toMatchObject({ statusCode: 200 })
    })

    it('#7 plain http:// GET-forward (not CONNECT) reaches an allowlisted gateway origin → 200', async () => {
        const result = await runProbeInNetns({
            plan: [{ type: 'http-get-via-proxy', url: `http://${GATEWAY_HOST}:${gatewayEcho.port}/forward-path` }],
        })
        expect(result.results[0]).toMatchObject({ statusCode: 200 })
    })

    it('#8 raw TCP to an allowlisted EXTERNAL host (not the gateway) fails closed — no route off the /30', async () => {
        // 8.8.8.8 would pass the SSRF classifier (public unicast), but the sandbox has no
        // route to it: only proxy-tunnelable traffic egresses. A raw, non-proxy TCP connect
        // must fail with a no-route error, locking the documented non-HTTP limitation.
        const result = await runProbeInNetns({
            plan: [{ type: 'direct-tcp-connect', host: '8.8.8.8', port: 53 }],
        })
        expect(result.results[0]).toMatchObject({ status: 'ERR' })
        expect(result.results[0]?.['code']).toMatch(/ENETUNREACH|EHOSTUNREACH|ETIMEDOUT|TIMEOUT/)
    })

    async function runProbeInNetns({ plan }: { plan: unknown[] }): Promise<{ results: Array<{ [k: string]: unknown }> }> {
        const maker = isolateProcess(silentLogger(), path.join(commonDir, 'egress-probe.js'), commonDir, BOX_ID, ns.netnsName)
        const child = await maker.create({
            sandboxId: 'e2e-egress-completeness',
            command: [],
            mounts: [{ hostPath: commonDir, sandboxPath: '/root/common' }],
            env: {
                HOME: '/tmp/',
                NODE_PATH: '/usr/src/node_modules',
                AP_EXECUTION_MODE: 'SANDBOX_PROCESS',
                AP_SANDBOX_WS_PORT: '0',
                AP_SANDBOX_WS_TOKEN: 'e2e-token-aaaaaaaaaaaaaaaaaaaaaaaa',
                AP_BASE_CODE_DIRECTORY: '/root/codes',
                SANDBOX_ID: 'e2e-egress-completeness',
                AP_EGRESS_PROXY_URL: `http://${GATEWAY_HOST}:${proxy.port}`,
                AP_PROBE_PLAN: JSON.stringify(plan),
            },
            resourceLimits: { memoryLimitMb: 256, cpuMsPerSec: 1000, timeLimitSeconds: 30 },
        })
        return collectProbeJson(child)
    }
})

async function readHostsOrNull(): Promise<string | null> {
    try {
        return await readFile(HOSTS_FILE, 'utf8')
    }
    catch {
        return null
    }
}

async function startGatewayHttpEcho(host: string): Promise<{ server: http.Server, port: number }> {
    const server = http.createServer((_req, res) => {
        res.writeHead(200, { 'Content-Type': 'text/plain' })
        res.end('gateway-echo')
    })
    await new Promise<void>((resolve) => server.listen(0, host, () => resolve()))
    const address = server.address()
    if (typeof address !== 'object' || address === null) throw new Error('could not determine gateway echo port')
    return { server, port: address.port }
}

async function collectProbeJson(child: ChildProcess): Promise<{ results: Array<{ [k: string]: unknown }> }> {
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
    if (!jsonLine) throw new Error(`No JSON on probe stdout (exit=${exitCode}). stdout="${out}" stderr="${err}"`)
    return JSON.parse(jsonLine)
}
