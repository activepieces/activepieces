import { ChildProcess } from 'node:child_process'
import { chmod, copyFile, mkdtemp } from 'node:fs/promises'
import http from 'node:http'
import net from 'node:net'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { egressNetns, EgressNetns } from '../../src/lib/egress/netns'
import { EgressProxy, startEgressProxy } from '../../src/lib/egress/proxy'
import { sandboxCapacity } from '../../src/lib/sandbox/capacity'
import { getIsolateExecutableName, isolateProcess } from '../../src/lib/sandbox/isolate'
import { requireIsolateBinary, requireLinuxPrivileged } from './helpers/privilege-guard'
import { silentLogger } from './helpers/silent-logger'

/**
 * Concurrency under the shared `ap-egress` netns (ADR 0001 open question #1: start
 * with one shared netns). Mirrors AP_WORKER_CONCURRENCY>1: several isolate boxes run
 * at once in the SAME namespace, each reaching the proxy on the gateway AND its own
 * per-box WS-RPC port (sandboxCapacity.wsRpcPortForBox) simultaneously. All must
 * succeed — proving the single shared netns is safe for concurrent sandboxes.
 */

const GATEWAY_HOST = '10.255.0.1'
const BOX_IDS = [1, 2, 3]
const ISOLATE_BINARY_PATH = path.resolve(process.cwd(), 'packages/server/api/src/assets', getIsolateExecutableName())

const skip = requireLinuxPrivileged() ?? requireIsolateBinary(ISOLATE_BINARY_PATH)

describe.skipIf(skip)('sandbox concurrency — multiple boxes share ap-egress', () => {
    let ns: EgressNetns
    let proxy: EgressProxy
    let gatewayEcho: { server: http.Server, port: number }
    let wsRpcListeners: { server: net.Server, port: number }[]
    let commonDir: string

    beforeAll(async () => {
        ns = await egressNetns.create({ log: silentLogger() })
        gatewayEcho = await startGatewayHttpEcho(GATEWAY_HOST)
        proxy = await startEgressProxy({ log: silentLogger(), host: ns.gatewayHost, allowList: [ns.gatewayHost] })

        // One WS-RPC listener per box, each on the box's stable per-box port, bound to the gateway.
        wsRpcListeners = []
        for (const boxId of BOX_IDS) {
            wsRpcListeners.push(await startGatewayTcpListener(GATEWAY_HOST, sandboxCapacity.wsRpcPortForBox(boxId)))
        }

        commonDir = await mkdtemp(path.join(tmpdir(), 'ap-concurrency-'))
        const probeDst = path.join(commonDir, 'egress-probe.js')
        await copyFile(path.resolve(__dirname, 'fixtures/egress-probe.js'), probeDst)
        await chmod(commonDir, 0o755)
        await chmod(probeDst, 0o644)
    }, 60_000)

    afterAll(async () => {
        await proxy?.close()
        await new Promise<void>((resolve) => gatewayEcho?.server.close(() => resolve()))
        for (const l of wsRpcListeners ?? []) {
            await new Promise<void>((resolve) => l.server.close(() => resolve()))
        }
        await ns?.destroy()
    })

    it('all 3 boxes concurrently reach the proxy AND their own WS-RPC port over the shared netns', async () => {
        const results = await Promise.all(BOX_IDS.map((boxId) => runBoxProbe({ boxId })))

        for (const { boxId, result } of results) {
            const proxyResult = result.results[0]
            const rpcResult = result.results[1]
            expect(proxyResult, `box ${boxId} proxy GET`).toMatchObject({ statusCode: 200 })
            expect(rpcResult, `box ${boxId} WS-RPC connect`).toMatchObject({ status: 'OK' })
        }
    }, 90_000)

    async function runBoxProbe({ boxId }: { boxId: number }): Promise<{ boxId: number, result: ProbeOutput }> {
        const wsRpcPort = sandboxCapacity.wsRpcPortForBox(boxId)
        const plan = [
            { type: 'http-get-via-proxy', url: `http://${GATEWAY_HOST}:${gatewayEcho.port}/box-${boxId}` },
            { type: 'direct-tcp-connect', host: GATEWAY_HOST, port: wsRpcPort },
        ]
        const maker = isolateProcess(silentLogger(), path.join(commonDir, 'egress-probe.js'), commonDir, boxId, ns.netnsName)
        const child = await maker.create({
            sandboxId: `e2e-concurrency-${boxId}`,
            command: [],
            mounts: [{ hostPath: commonDir, sandboxPath: '/root/common' }],
            env: {
                HOME: '/tmp/',
                NODE_PATH: '/usr/src/node_modules',
                AP_EXECUTION_MODE: 'SANDBOX_PROCESS',
                AP_SANDBOX_WS_PORT: String(wsRpcPort),
                AP_SANDBOX_WS_HOST: GATEWAY_HOST,
                AP_SANDBOX_WS_TOKEN: 'e2e-token-aaaaaaaaaaaaaaaaaaaaaaaa',
                AP_BASE_CODE_DIRECTORY: '/root/codes',
                SANDBOX_ID: `e2e-concurrency-${boxId}`,
                AP_EGRESS_PROXY_URL: `http://${GATEWAY_HOST}:${proxy.port}`,
                AP_PROBE_PLAN: JSON.stringify(plan),
            },
            resourceLimits: { memoryLimitMb: 256, cpuMsPerSec: 2000, timeLimitSeconds: 60 },
        })
        return { boxId, result: await collectProbeJson(child) }
    }
})

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

async function startGatewayTcpListener(host: string, port: number): Promise<{ server: net.Server, port: number }> {
    const server = net.createServer((socket) => {
        socket.on('data', (chunk) => socket.write(chunk))
        socket.on('error', () => socket.destroy())
    })
    await new Promise<void>((resolve, reject) => {
        server.once('error', reject)
        server.listen(port, host, () => {
            server.removeListener('error', reject)
            resolve()
        })
    })
    return { server, port }
}

async function collectProbeJson(child: ChildProcess): Promise<ProbeOutput> {
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

type ProbeOutput = { results: Array<{ [k: string]: unknown }> }
