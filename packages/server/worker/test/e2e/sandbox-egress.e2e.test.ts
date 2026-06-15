import http from 'node:http'
import { chmod, mkdtemp, copyFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { egressNetns, EgressNetns } from '../../src/lib/egress/netns'
import { startEgressProxy, EgressProxy } from '../../src/lib/egress/proxy'
import { getIsolateExecutableName, isolateProcess } from '../../src/lib/sandbox/isolate'
import { requireIsolateBinary, requireLinuxPrivileged } from './helpers/privilege-guard'
import { silentLogger } from './helpers/silent-logger'

/**
 * Egress isolation under the netns model: the sandbox runs inside `ap-egress`, whose
 * only route is the /30 veth link to the worker. The worker hosts the proxy + a plain
 * HTTP echo on the gateway veth IP. The sandbox can reach the gateway, but has NO route
 * to the internet / private / metadata ranges — that block is topological (no default
 * route), not a firewall. This mirrors exactly what production does: `ip netns exec
 * ap-egress isolate --share-net …`.
 */

const BOX_ID = 0
const GATEWAY_HOST = '10.255.0.1'
const ISOLATE_BINARY_PATH = path.resolve(process.cwd(), 'packages/server/api/src/assets', getIsolateExecutableName())

const skip = requireLinuxPrivileged() ?? requireIsolateBinary(ISOLATE_BINARY_PATH)

describe.skipIf(skip)('sandbox egress — netns model (proxy on gateway + isolate in ap-egress)', () => {
    let ns: EgressNetns
    let proxy: EgressProxy
    let gatewayEcho: { server: http.Server, port: number }
    let commonDir: string

    beforeAll(async () => {
        ns = await egressNetns.create({ log: silentLogger() })

        gatewayEcho = await startGatewayEcho(GATEWAY_HOST)

        proxy = await startEgressProxy({
            log: silentLogger(),
            host: ns.gatewayHost,
            // Allowlist the gateway so a CONNECT/GET to the on-gateway echo is permitted.
            allowList: [ns.gatewayHost],
        })

        commonDir = await mkdtemp(path.join(tmpdir(), 'ap-sandbox-egress-'))
        const probeDst = path.join(commonDir, 'egress-probe.js')
        await copyFile(path.resolve(__dirname, 'fixtures/egress-probe.js'), probeDst)
        await chmod(commonDir, 0o755)
        await chmod(probeDst, 0o644)
    }, 60_000)

    afterAll(async () => {
        await proxy?.close()
        await new Promise<void>((resolve) => gatewayEcho?.server.close(() => resolve()))
        await ns?.destroy()
    })

    it('reaches an allowlisted target on the gateway THROUGH the proxy', async () => {
        const result = await runProbeInNetns({
            plan: [{ type: 'http-get-via-proxy', url: `http://${GATEWAY_HOST}:${gatewayEcho.port}/allowed` }],
        })
        expect(result.results[0]).toMatchObject({ statusCode: 200 })
    })

    it('the proxy refuses a blocked metadata IP with 403 even when reached through it', async () => {
        const result = await runProbeInNetns({
            plan: [{ type: 'http-get-via-proxy', url: 'http://169.254.169.254/latest/meta-data/' }],
        })
        expect(result.results[0]).toMatchObject({ statusCode: 403 })
    })

    it('is blocked (no route) from a direct private IP', async () => {
        const result = await runProbeInNetns({
            plan: [{ type: 'direct-tcp-connect', host: '10.0.0.1', port: 80 }],
        })
        expect(result.results[0]).toMatchObject({ status: 'ERR' })
        expect(result.results[0].code).toMatch(/ENETUNREACH|EHOSTUNREACH|ECONNREFUSED|ETIMEDOUT|TIMEOUT/)
    })

    it('is blocked (no route) from the cloud-metadata IP 169.254.169.254', async () => {
        const result = await runProbeInNetns({
            plan: [{ type: 'direct-tcp-connect', host: '169.254.169.254', port: 80 }],
        })
        expect(result.results[0]).toMatchObject({ status: 'ERR' })
        expect(result.results[0].code).toMatch(/ENETUNREACH|EHOSTUNREACH|ECONNREFUSED|ETIMEDOUT|TIMEOUT/)
    })

    it('is blocked (no route) from a direct public internet IP — cannot bypass the proxy', async () => {
        const result = await runProbeInNetns({
            plan: [{ type: 'direct-tcp-connect', host: '1.1.1.1', port: 80 }],
        })
        expect(result.results[0]).toMatchObject({ status: 'ERR' })
        expect(result.results[0].code).toMatch(/ENETUNREACH|EHOSTUNREACH|ECONNREFUSED|ETIMEDOUT|TIMEOUT/)
    })

    it('can reach the proxy on the gateway directly (the single open door)', async () => {
        const result = await runProbeInNetns({
            plan: [{ type: 'direct-tcp-connect', host: GATEWAY_HOST, port: proxy.port }],
        })
        expect(result.results[0]).toMatchObject({ status: 'OK' })
    })

    async function runProbeInNetns({ plan }: { plan: unknown[] }): Promise<{ results: Array<{ [k: string]: unknown }> }> {
        const logger = silentLogger()
        const maker = isolateProcess(logger, path.join(commonDir, 'egress-probe.js'), commonDir, BOX_ID, ns.netnsName)
        const child = await maker.create({
            sandboxId: 'e2e-egress',
            command: [],
            mounts: [{ hostPath: commonDir, sandboxPath: '/root/common' }],
            env: {
                HOME: '/tmp/',
                NODE_PATH: '/usr/src/node_modules',
                AP_EXECUTION_MODE: 'SANDBOX_PROCESS',
                AP_SANDBOX_WS_PORT: '0',
                AP_SANDBOX_WS_TOKEN: 'e2e-token-aaaaaaaaaaaaaaaaaaaaaaaa',
                AP_BASE_CODE_DIRECTORY: '/root/codes',
                SANDBOX_ID: 'e2e-egress',
                AP_EGRESS_PROXY_URL: `http://${GATEWAY_HOST}:${proxy.port}`,
                AP_PROBE_PLAN: JSON.stringify(plan),
            },
            resourceLimits: { memoryLimitMb: 256, cpuMsPerSec: 1000, timeLimitSeconds: 30 },
        })
        return collectProbeJson(child)
    }
})

async function startGatewayEcho(host: string): Promise<{ server: http.Server, port: number }> {
    const server = http.createServer((_req, res) => {
        res.writeHead(200, { 'Content-Type': 'text/plain' })
        res.end('gateway-echo')
    })
    await new Promise<void>((resolve) => server.listen(0, host, () => resolve()))
    const address = server.address()
    if (typeof address !== 'object' || address === null) throw new Error('could not determine gateway echo port')
    return { server, port: address.port }
}

async function collectProbeJson(child: import('child_process').ChildProcess): Promise<{ results: Array<{ [k: string]: unknown }> }> {
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
