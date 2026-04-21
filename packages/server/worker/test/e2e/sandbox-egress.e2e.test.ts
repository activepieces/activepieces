import { chmod, mkdtemp, copyFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { sandboxCapacity } from '../../src/lib/sandbox/capacity'
import { getIsolateExecutableName, isolateProcess } from '../../src/lib/sandbox/isolate'
import { iptablesLockdown, IptablesLockdown } from '../../src/lib/egress/iptables-lockdown'
import { startEgressProxy, EgressProxy } from '../../src/lib/egress/proxy'
import { requireIsolateBinary, requireLinuxPrivileged } from './helpers/privilege-guard'
import { silentLogger } from './helpers/silent-logger'
import { EchoServer, startHttpEcho } from './helpers/test-server'

const BOX_ID = 0
const SANDBOX_UID = sandboxCapacity.firstBoxUid + BOX_ID
const ISOLATE_BINARY_PATH = path.resolve(process.cwd(), 'packages/server/api/src/assets', getIsolateExecutableName())

const skip = requireLinuxPrivileged() ?? requireIsolateBinary(ISOLATE_BINARY_PATH)

describe.skipIf(skip)('sandbox egress — full stack (proxy + iptables + isolate)', () => {
    let proxy: EgressProxy
    let echo: EchoServer
    let lockdown: IptablesLockdown | null = null
    let commonDir: string

    beforeAll(async () => {
        echo = await startHttpEcho()
        proxy = await startEgressProxy({
            log: silentLogger(),
            allowList: ['127.0.0.1'],
        })

        commonDir = await mkdtemp(path.join(tmpdir(), 'ap-sandbox-e2e-'))
        const probeDst = path.join(commonDir, 'egress-probe.js')
        await copyFile(path.resolve(__dirname, 'fixtures/egress-probe.js'), probeDst)
        // sandbox UID must be able to read the probe. mkdtemp creates 0700 dirs.
        await chmod(commonDir, 0o755)
        await chmod(probeDst, 0o644)
    })

    afterAll(async () => {
        await proxy?.close()
        await echo?.close()
    })

    beforeEach(async () => {
        lockdown = await iptablesLockdown.apply({
            log: silentLogger(),
            proxyPort: proxy.port,
            firstBoxUid: SANDBOX_UID,
            numBoxes: 1,
        })
    })

    afterEach(async () => {
        if (lockdown) {
            await lockdown.remove()
            lockdown = null
        }
    })

    it('proxy allows allowlisted HTTP GET and rejects blocked IP with 403', async () => {
        const result = await runProbeInSandbox({
            commonDir,
            plan: [
                { type: 'http-get-via-proxy', url: `http://127.0.0.1:${echo.port}/allowed` },
                { type: 'http-get-via-proxy', url: 'http://169.254.169.254/latest/meta-data/' },
            ],
            proxyPort: proxy.port,
        })
        expect(result.results).toHaveLength(2)
        expect(result.results[0]).toMatchObject({ statusCode: 200 })
        expect(result.results[1]).toMatchObject({ statusCode: 403 })
    })

    it('iptables blocks the sandbox from bypassing the proxy to non-allowlisted loopback ports', async () => {
        const result = await runProbeInSandbox({
            commonDir,
            plan: [
                { type: 'direct-tcp-connect', host: '127.0.0.1', port: echo.port },
            ],
            proxyPort: proxy.port,
        })
        expect(result.results[0]).toMatchObject({ status: 'ERR' })
        expect(result.results[0].code).toMatch(/EHOSTUNREACH|ENETUNREACH|ECONNREFUSED|EACCES|EPERM/)
    })

    it('iptables allows the sandbox to reach the proxy port directly', async () => {
        const result = await runProbeInSandbox({
            commonDir,
            plan: [
                { type: 'direct-tcp-connect', host: '127.0.0.1', port: proxy.port },
            ],
            proxyPort: proxy.port,
        })
        expect(result.results[0]).toMatchObject({ status: 'OK' })
    })
})

async function runProbeInSandbox({ commonDir, plan, proxyPort }: {
    commonDir: string
    plan: unknown[]
    proxyPort: number
}): Promise<{ results: Array<{ action: unknown, [k: string]: unknown }> }> {
    const logger = silentLogger()
    const maker = isolateProcess(logger, path.join(commonDir, 'egress-probe.js'), commonDir, BOX_ID)

    const proxyUrl = `http://127.0.0.1:${proxyPort}`
    const child = await maker.create({
        sandboxId: 'e2e-probe',
        command: [],
        mounts: [
            { hostPath: commonDir, sandboxPath: '/root/common' },
        ],
        env: {
            HOME: '/tmp/',
            NODE_PATH: '/usr/src/node_modules',
            AP_EXECUTION_MODE: 'SANDBOX_PROCESS',
            AP_SANDBOX_WS_PORT: '0',
            AP_BASE_CODE_DIRECTORY: '/root/codes',
            SANDBOX_ID: 'e2e-probe',
            HTTP_PROXY: proxyUrl,
            HTTPS_PROXY: proxyUrl,
            http_proxy: proxyUrl,
            https_proxy: proxyUrl,
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
    if (!jsonLine) throw new Error(`No JSON on probe stdout (exit=${exitCode}). stdout="${out}" stderr="${err}"`)
    return JSON.parse(jsonLine)
}
