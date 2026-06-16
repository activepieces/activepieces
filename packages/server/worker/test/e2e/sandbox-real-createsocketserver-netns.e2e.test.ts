import { spawnSync } from 'node:child_process'
import { chmod, mkdtemp } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { WorkerContract } from '@activepieces/shared'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { egressNetns, EgressNetns } from '../../src/lib/egress/netns'
import { getIsolateExecutableName, isolateProcess } from '../../src/lib/sandbox/isolate'
import { createSandbox } from '../../src/lib/sandbox/sandbox'
import { Sandbox, SandboxInitOptions } from '../../src/lib/sandbox/types'
import { requireIsolateBinary, requireLinuxPrivileged } from './helpers/privilege-guard'
import { silentLogger } from './helpers/silent-logger'

/**
 * Drives the REAL production sandbox path — `createSandbox` → `createSocketServer` —
 * in STRICT mode, where the WS-RPC server binds to the gateway veth IP
 * (wsRpcHost = gatewayHost) on a fixed per-box port, and the engine runs inside
 * `ap-egress` via `isolateProcess(... netnsName)`.
 *
 * The sibling sandbox-rpc-netns test reimplements the WS server with the correct
 * `listen(port, host, callback)` pattern, so it never exercised the bug where
 * createSocketServer read httpServer.address() synchronously after listen(port, host).
 * With a host arg the bind is deferred behind an async DNS lookup, so address() was
 * null and every STRICT start threw "Could not determine socket.io server port".
 * This test fails against that regression and passes once the bind awaits 'listening'.
 */

const BOX_ID = 0
const GATEWAY_HOST = '10.255.0.1'
const WS_RPC_PORT = 52007
const ISOLATE_BINARY_PATH = path.resolve(process.cwd(), 'packages/server/api/src/assets', getIsolateExecutableName())

const skip = requireLinuxPrivileged() ?? requireIsolateBinary(ISOLATE_BINARY_PATH)

describe.skipIf(skip)('real createSandbox WS-RPC over netns veth (STRICT, host-bound fixed port)', () => {
    let ns: EgressNetns
    let commonDir: string
    let sandbox: Sandbox

    beforeAll(async () => {
        ns = await egressNetns.create({ log: silentLogger() })

        commonDir = await mkdtemp(path.join(tmpdir(), 'ap-real-css-netns-'))
        const probeDst = path.join(commonDir, 'rpc-engine-probe.js')
        bundleFixtureOrThrow({ entry: path.resolve(__dirname, 'fixtures/rpc-engine-probe.js'), outFile: probeDst })
        await chmod(commonDir, 0o755)
        await chmod(probeDst, 0o644)

        const options: SandboxInitOptions = {
            env: {
                HOME: '/tmp/',
                NODE_PATH: '/usr/src/node_modules',
                AP_EXECUTION_MODE: 'SANDBOX_PROCESS',
                // STRICT: the engine inside ap-egress reaches the worker only on the gateway IP.
                AP_SANDBOX_WS_HOST: GATEWAY_HOST,
            },
            memoryLimitMb: 256,
            cpuMsPerSec: 4000,
            timeLimitSeconds: 60,
            reusable: false,
            maxHttpBufferSizeBytes: 100 * 1024 * 1024,
            baseMounts: [{ hostPath: commonDir, sandboxPath: '/root/common' }],
            // Exactly what create-sandbox-for-job passes in isolate + STRICT mode.
            wsRpcPort: WS_RPC_PORT,
            wsRpcHost: GATEWAY_HOST,
        }

        const processMaker = isolateProcess(silentLogger(), probeDst, commonDir, BOX_ID, ns.netnsName)
        sandbox = createSandbox(silentLogger(), 'e2e-real-css', options, processMaker, stubWorkerHandlers())
    }, 60_000)

    afterAll(async () => {
        await sandbox?.shutdown()
        await ns?.destroy()
    })

    it('start() binds the gateway-host fixed port and the engine connects back over the veth', async () => {
        await expect(sandbox.start({ flowVersionId: undefined, platformId: '', mounts: [] })).resolves.toBeUndefined()
        expect(sandbox.isReady()).toBe(true)
    }, 40_000)
})

function stubWorkerHandlers(): WorkerContract {
    const noop = async (): Promise<void> => undefined
    return {
        updateRunProgress: noop,
        uploadRunLog: noop,
        sendFlowResponse: noop,
        updateStepProgress: noop,
    }
}

function bundleFixtureOrThrow({ entry, outFile }: { entry: string, outFile: string }): void {
    const r = spawnSync('bun', ['build', entry, '--target', 'node', '--format', 'cjs', '--outfile', outFile], { encoding: 'utf8' })
    if (r.status !== 0) {
        throw new Error(`bun build failed for ${entry} → ${outFile}: ${r.stderr || r.stdout}`)
    }
}
