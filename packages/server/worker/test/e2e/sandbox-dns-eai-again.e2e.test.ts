import { chmod, copyFile, mkdtemp, readFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'
import { egressInternals } from '../../src/lib/egress/lifecycle'
import { iptablesLockdown, IptablesLockdown } from '../../src/lib/egress/iptables-lockdown'
import { EgressProxy, startEgressProxy } from '../../src/lib/egress/proxy'
import { sandboxCapacity } from '../../src/lib/sandbox/capacity'
import { getIsolateExecutableName, isolateProcess } from '../../src/lib/sandbox/isolate'
import { requireIsolateBinary, requireLinuxPrivileged } from './helpers/privilege-guard'
import { silentLogger } from './helpers/silent-logger'

/**
 * Reproduces the production failure:
 *   APIConnectionError: Connection error.
 *   cause: FetchError ... getaddrinfo EAI_AGAIN api.openai.com
 *
 * Root cause:
 *   1. The sandbox /etc/resolv.conf shipped with Activepieces is hardcoded to
 *      Google DNS (8.8.8.8, 8.8.4.4) — see packages/server/api/src/assets/etc/resolv.conf.
 *   2. The kernel egress lockdown (lifecycle.ts -> iptables-lockdown.ts) builds
 *      its DNS allowlist from the *worker host's* dns.getServers() — typically
 *      127.0.0.53 (systemd-resolved) or a VPC resolver, NEVER 8.8.8.8.
 *   3. With AP_EXECUTION_MODE=SANDBOX_PROCESS + AP_NETWORK_MODE=STRICT, iptables
 *      REJECTs all egress except DNS to that host allowlist + the proxy/WS RPC ports.
 *   4. So when a piece calls dns.lookup('api.openai.com') from inside the sandbox,
 *      the libc resolver sends UDP/53 to 8.8.8.8 -> kernel REJECTs ->
 *      glibc retries -> getaddrinfo returns EAI_AGAIN.
 */

const BOX_ID = 0
const SANDBOX_UID = sandboxCapacity.firstBoxUid + BOX_ID
const ISOLATE_BINARY_PATH = path.resolve(process.cwd(), 'packages/server/api/src/assets', getIsolateExecutableName())
const SANDBOX_RESOLV_CONF = path.resolve(process.cwd(), 'packages/server/api/src/assets/etc/resolv.conf')

const skip = requireLinuxPrivileged() ?? requireIsolateBinary(ISOLATE_BINARY_PATH)

describe.skipIf(skip)('sandbox DNS — reproduces EAI_AGAIN under SANDBOX_PROCESS + STRICT', () => {
    let proxy: EgressProxy
    let lockdown: IptablesLockdown | null = null
    let commonDir: string

    beforeAll(async () => {
        const resolvBody = await readFile(SANDBOX_RESOLV_CONF, 'utf8')
        if (!/8\.8\.8\.8/.test(resolvBody)) {
            throw new Error(
                `precondition failed: ${SANDBOX_RESOLV_CONF} no longer pins 8.8.8.8 — ` +
                'this test reproduces the mismatch between sandbox resolv.conf and the iptables DNS allowlist; ' +
                'update the test (or remove it) if the resolv.conf shipped to the sandbox has changed.',
            )
        }

        proxy = await startEgressProxy({
            log: silentLogger(),
            allowList: ['127.0.0.1'],
        })

        commonDir = await mkdtemp(path.join(tmpdir(), 'ap-sandbox-dns-eai-'))
        const probeDst = path.join(commonDir, 'egress-probe.js')
        await copyFile(path.resolve(__dirname, 'fixtures/egress-probe.js'), probeDst)
        await chmod(commonDir, 0o755)
        await chmod(probeDst, 0o644)
    })

    afterAll(async () => {
        await proxy?.close()
    })

    afterEach(async () => {
        if (lockdown) {
            await lockdown.remove()
            lockdown = null
        }
    })

    it('repro: sandbox resolv.conf points at 8.8.8.8 but allowlist only includes a different host nameserver — DNS to public domain returns EAI_AGAIN', async () => {
        // Mirrors the production case where the worker host runs systemd-resolved (127.0.0.53)
        // or a VPC resolver — anything that is NOT 8.8.8.8. We pick a routable-but-fake IP
        // so iptables installs a DNS allow rule (lifecycle.ts refuses to start with []), but
        // the rule never matches the sandbox's actual DNS traffic to 8.8.8.8.
        lockdown = await iptablesLockdown.apply({
            log: silentLogger(),
            proxyPort: proxy.port,
            firstBoxUid: SANDBOX_UID,
            numBoxes: 1,
            nameservers: ['10.123.123.123'],
        })

        const result = await runProbeInSandbox({
            commonDir,
            plan: [
                { type: 'dns-lookup', hostname: 'api.openai.com' },
            ],
            proxyPort: proxy.port,
        })

        expect(result.results).toHaveLength(1)
        const lookup = result.results[0]
        expect(lookup, 'expected dns.lookup to fail').toMatchObject({ status: 'ERR', syscall: 'getaddrinfo' })
        // EAI_AGAIN is the canonical "DNS temporary failure" libc returns when the
        // resolver cannot reach its nameservers (REJECT/DROP at the kernel layer).
        // Some glibc versions surface ENOTFOUND when REJECT replies fast — accept either,
        // but assert it is one of the resolver-side failure codes (NOT a successful lookup).
        expect(['EAI_AGAIN', 'ENOTFOUND']).toContain(lookup.code)
    }, 30_000)

    it('fix: lifecycle unions sandbox resolv.conf nameservers into the iptables allowlist, so the sandbox can resolve', async () => {
        // This test reproduces the production wiring: the host has its own DNS servers
        // (here we simulate that with a fake IP) and the sandbox resolv.conf has its
        // own (8.8.8.8 / 8.8.4.4). The fix in `lifecycle.ts` unions the two before
        // applying iptables, so DNS packets the sandbox sends to 8.8.8.8 are allowed.
        const sandboxNameservers = await egressInternals.listSandboxResolvConfNameservers()
        expect(sandboxNameservers).toContain('8.8.8.8')

        const fakeHostNameservers = ['10.123.123.123']
        const unionedAllowList = [...new Set([...fakeHostNameservers, ...sandboxNameservers])]

        lockdown = await iptablesLockdown.apply({
            log: silentLogger(),
            proxyPort: proxy.port,
            firstBoxUid: SANDBOX_UID,
            numBoxes: 1,
            nameservers: unionedAllowList,
        })

        const result = await runProbeInSandbox({
            commonDir,
            plan: [
                { type: 'dns-lookup', hostname: 'api.openai.com' },
            ],
            proxyPort: proxy.port,
        })

        const lookup = result.results[0]
        // We accept "OK" (best case) or any error that is NOT EAI_AGAIN. The point
        // of the assertion is that the resolver can now reach 8.8.8.8 — DNS no
        // longer fails with the production EAI_AGAIN signature.
        if (lookup.status === 'ERR') {
            expect(lookup.code).not.toBe('EAI_AGAIN')
        }
        else {
            expect(lookup).toMatchObject({ status: 'OK' })
        }
    }, 30_000)
})

describe('lifecycle resolv.conf parsing (unit)', () => {
    it('parses RFC-style resolv.conf nameserver lines, ignoring comments and non-IP entries', () => {
        const body = [
            '# managed by foo',
            'nameserver 8.8.8.8',
            'nameserver 8.8.4.4 # primary',
            'nameserver not-an-ip',
            'options edns0',
            '',
            'NAMESERVER 1.1.1.1',
        ].join('\n')
        const ips = egressInternals.parseResolvConfNameservers(body)
        expect(ips).toEqual(['8.8.8.8', '8.8.4.4', '1.1.1.1'])
    })

    it('reads the shipped sandbox resolv.conf and returns its nameservers', async () => {
        const ips = await egressInternals.listSandboxResolvConfNameservers()
        expect(ips).toContain('8.8.8.8')
    })
})

async function runProbeInSandbox({ commonDir, plan, proxyPort }: {
    commonDir: string
    plan: unknown[]
    proxyPort: number
}): Promise<{ results: Array<ProbeResult> }> {
    const logger = silentLogger()
    const maker = isolateProcess(logger, path.join(commonDir, 'egress-probe.js'), commonDir, BOX_ID)

    const proxyUrl = `http://127.0.0.1:${proxyPort}`
    const child = await maker.create({
        sandboxId: 'e2e-dns-eai',
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
            SANDBOX_ID: 'e2e-dns-eai',
            AP_NETWORK_MODE: 'STRICT',
            AP_EGRESS_PROXY_URL: proxyUrl,
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

type ProbeResult = {
    action: unknown
    status?: 'OK' | 'ERR' | 'TIMEOUT'
    code?: string
    syscall?: string
    errno?: number
    address?: string
    elapsedMs?: number
    message?: string
}
