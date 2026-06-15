import { spawnSync } from 'node:child_process'
import { chmod, copyFile, mkdtemp, stat } from 'node:fs/promises'
import { createServer, Server as HttpServer } from 'node:http'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { createRpcClient } from '@activepieces/shared'
import { Server as SocketIOServer, Socket } from 'socket.io'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { egressNetns, EgressNetns } from '../../src/lib/egress/netns'
import { getIsolateExecutableName, isolateProcess } from '../../src/lib/sandbox/isolate'
import { requireIsolateBinary, requireLinuxPrivileged } from './helpers/privilege-guard'
import { silentLogger } from './helpers/silent-logger'

/**
 * Full engine<->worker socket.io RPC round-trip over the gateway veth in STRICT.
 *
 * The worker hosts the WS-RPC server on the gateway veth IP exactly as
 * sandbox.ts `createSocketServer` does (socket.io Server, `/worker/ws` path,
 * handshake-token auth). A fixture "engine" runs inside `ap-egress` via
 * `isolateProcess(... 'ap-egress')`, mirrors engine/worker-socket.ts (connect back
 * to AP_SANDBOX_WS_HOST:AP_SANDBOX_WS_PORT, authenticate, answer one
 * executeOperation). We then drive a real `executeOperation` RPC from the worker
 * and assert the engine echoes our marker back — proving the load-bearing control
 * channel works topologically through the /30 veth (currently only smoke-tested by
 * a raw TCP probe).
 */

const BOX_ID = 0
const GATEWAY_HOST = '10.255.0.1'
const WS_TOKEN = 'e2e-rpc-token-aaaaaaaaaaaaaaaaaaaaaaaa'
const ISOLATE_BINARY_PATH = path.resolve(process.cwd(), 'packages/server/api/src/assets', getIsolateExecutableName())

const skip = requireLinuxPrivileged() ?? requireIsolateBinary(ISOLATE_BINARY_PATH)

describe.skipIf(skip)('sandbox RPC over netns veth (engine<->worker socket.io)', () => {
    let ns: EgressNetns
    let ws: WorkerWsServer
    let commonDir: string
    let child: import('child_process').ChildProcess

    beforeAll(async () => {
        ns = await egressNetns.create({ log: silentLogger() })
        ws = await startWorkerWsServer({ host: GATEWAY_HOST, token: WS_TOKEN })

        commonDir = await mkdtemp(path.join(tmpdir(), 'ap-rpc-netns-'))
        const probeDst = path.join(commonDir, 'rpc-engine-probe.js')
        await copyFile(path.resolve(__dirname, 'fixtures/rpc-engine-probe.js'), probeDst)
        await mirrorSocketIoClientInto(commonDir)
        await chmod(commonDir, 0o755)
        await chmod(probeDst, 0o644)

        const maker = isolateProcess(silentLogger(), probeDst, commonDir, BOX_ID, ns.netnsName)
        child = await maker.create({
            sandboxId: 'e2e-rpc-netns',
            command: [],
            mounts: [{ hostPath: commonDir, sandboxPath: '/root/common' }],
            env: {
                HOME: '/tmp/',
                NODE_PATH: '/usr/src/node_modules',
                AP_EXECUTION_MODE: 'SANDBOX_PROCESS',
                AP_SANDBOX_WS_HOST: GATEWAY_HOST,
                AP_SANDBOX_WS_PORT: String(ws.port),
                AP_SANDBOX_WS_TOKEN: WS_TOKEN,
                AP_BASE_CODE_DIRECTORY: '/root/codes',
                SANDBOX_ID: 'e2e-rpc-netns',
                AP_SOCKETIO_REQUIRE_PATH: '/root/common/socket.io-client',
            },
            resourceLimits: { memoryLimitMb: 256, cpuMsPerSec: 4000, timeLimitSeconds: 60 },
        })
        child.stdout?.on('data', () => undefined)
        child.stderr?.on('data', () => undefined)
    }, 60_000)

    afterAll(async () => {
        child?.kill('SIGKILL')
        await ws?.close()
        await ns?.destroy()
    })

    it('the engine in ap-egress connects back to the gateway-bound WS server', async () => {
        const socket = await ws.waitForConnection()
        expect(socket.connected).toBe(true)
    }, 30_000)

    it('an executeOperation RPC round-trips over the veth and the engine echoes the marker', async () => {
        const socket = await ws.waitForConnection()
        // The same wire contract (event 'rpc', { method, payload } + ack) the real engine
        // serves; we use a marker payload to prove an actual application-level round-trip,
        // not just a TCP/handshake. The fixture engine echoes operation.marker back.
        const client = createRpcClient<ProbeEngineContract>(socket, 20_000)
        const marker = `marker-${Date.now()}`
        const response = await client.executeOperation({
            operationType: 'EXECUTE_FLOW',
            operation: { marker },
        })
        expect(response.response.echoedMarker).toBe(marker)
    }, 30_000)
})

async function startWorkerWsServer({ host, token }: { host: string, token: string }): Promise<WorkerWsServer> {
    const httpServer: HttpServer = createServer()
    const io = new SocketIOServer(httpServer, { path: '/worker/ws', cors: { origin: '*' } })

    io.use((socket, next) => {
        const provided = socket.handshake.auth?.['connectionToken']
        if (provided !== token) {
            next(new Error('unauthorized'))
            return
        }
        next()
    })

    let connected: Socket | null = null
    let resolveConn: ((s: Socket) => void) | null = null
    io.on('connection', (socket) => {
        connected = socket
        if (resolveConn) {
            resolveConn(socket)
            resolveConn = null
        }
    })

    await new Promise<void>((resolve) => httpServer.listen(0, host, () => resolve()))
    const address = httpServer.address()
    if (typeof address !== 'object' || address === null) throw new Error('could not determine WS server port')

    return {
        port: address.port,
        waitForConnection: () => {
            if (connected && connected.connected) return Promise.resolve(connected)
            return new Promise<Socket>((resolve, reject) => {
                const timer = setTimeout(() => reject(new Error('engine did not connect within 25s')), 25_000)
                resolveConn = (s) => {
                    clearTimeout(timer)
                    resolve(s)
                }
            })
        },
        close: async () => {
            connected?.disconnect(true)
            // eslint-disable-next-line @typescript-eslint/await-thenable
            await io.close()
            await new Promise<void>((resolve) => httpServer.close(() => resolve()))
        },
    }
}

async function mirrorSocketIoClientInto(commonDir: string): Promise<void> {
    const root = await locateSocketIoClientRoot()
    const dest = path.join(commonDir, 'socket.io-client')
    const r = spawnSync('cp', ['-RL', root + '/.', dest], { encoding: 'utf8' })
    if (r.status !== 0) throw new Error(`failed to copy socket.io-client from ${root} → ${dest}: ${r.stderr}`)
    spawnSync('chmod', ['-R', 'a+rX', dest])
}

async function locateSocketIoClientRoot(): Promise<string> {
    const globResult = spawnSync('bash', ['-c', 'ls -d /usr/src/app/node_modules/.bun/socket.io-client@*/node_modules/socket.io-client 2>/dev/null | head -1'], { encoding: 'utf8' })
    const candidates = [globResult.stdout.trim(), '/usr/src/app/node_modules/socket.io-client'].filter((c) => c.length > 0)
    for (const c of candidates) {
        try {
            await stat(path.join(c, 'package.json'))
            return c
        }
        catch {
            continue
        }
    }
    throw new Error(`socket.io-client not found in any of: ${candidates.join(', ')}`)
}

type WorkerWsServer = {
    port: number
    waitForConnection: () => Promise<Socket>
    close: () => Promise<void>
}

type ProbeEngineContract = {
    executeOperation(input: { operationType: string, operation: { marker: string } }): Promise<{ status: string, response: { echoedMarker: string } }>
}
