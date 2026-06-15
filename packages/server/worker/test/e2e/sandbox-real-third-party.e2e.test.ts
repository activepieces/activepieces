import { spawnSync } from 'node:child_process'
import { chmod, copyFile, mkdtemp, stat } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { egressNetns, EgressNetns } from '../../src/lib/egress/netns'
import { EgressProxy, startEgressProxy } from '../../src/lib/egress/proxy'
import { getIsolateExecutableName, isolateProcess } from '../../src/lib/sandbox/isolate'
import { requireOutboundInternet } from './helpers/outbound-internet-guard'
import { requireIsolateBinary, requireLinuxPrivileged } from './helpers/privilege-guard'
import { silentLogger } from './helpers/silent-logger'

/**
 * Reaches out to a curated list of real, public third-party API hosts from inside
 * the production-shaped netns stack: SANDBOX_PROCESS + STRICT + ap-egress netns +
 * egress proxy on the gateway veth IP.
 *
 * The sandbox has NO route off the /30 and does NO direct DNS — all name resolution
 * happens at the proxy via CONNECT-by-hostname. Any future change that breaks proxy
 * CONNECT / TLS / netns routing for the sandbox will fail this suite *before* it ships.
 */

const BOX_ID = 0
const GATEWAY_HOST = '10.255.0.1'
const ISOLATE_BINARY_PATH = path.resolve(process.cwd(), 'packages/server/api/src/assets', getIsolateExecutableName())

const PRIVILEGE_SKIP = requireLinuxPrivileged() ?? requireIsolateBinary(ISOLATE_BINARY_PATH)

describe.skipIf(PRIVILEGE_SKIP)('sandbox real third-party connectivity (SANDBOX_PROCESS + STRICT netns)', () => {
    let ns: EgressNetns
    let proxy: EgressProxy
    let commonDir: string
    let internetSkip: { skip: true, reason: string } | undefined

    beforeAll(async () => {
        internetSkip = await requireOutboundInternet()
        if (internetSkip) return

        ns = await egressNetns.create({ log: silentLogger() })
        proxy = await startEgressProxy({
            log: silentLogger(),
            host: ns.gatewayHost,
            // Empty user allow list: real public hosts pass the SSRF classifier; the gateway
            // is reachable by topology. No host is pre-listed — the proxy resolves + validates.
            allowList: [],
        })

        commonDir = await mkdtemp(path.join(tmpdir(), 'ap-real-3p-'))
        const probeDst = path.join(commonDir, 'egress-probe.js')
        await copyFile(path.resolve(__dirname, 'fixtures/egress-probe.js'), probeDst)
        await chmod(commonDir, 0o755)
        await chmod(probeDst, 0o644)
        // Mirror undici into the common dir so the sandbox can require it. Node has no
        // node:undici built-in; the bundled engine ships its own copy at runtime, but
        // this probe is a standalone JS fixture that has none.
        await mirrorUndiciInto(commonDir)
    }, 60_000)

    afterAll(async () => {
        if (proxy) await proxy.close()
        if (ns) await ns.destroy()
    })

    it.skipIf(PRIVILEGE_SKIP)('Group A — at least 80% of curated third-party APIs reach TLS+HTTP through the proxy (CONNECT-by-hostname)', async (ctx) => {
        if (internetSkip) ctx.skip()
        const plan = GROUP_A_HOSTS.map<ProbeAction>((host) =>
            ({ type: 'https-head-via-proxy', url: `https://${host}/`, timeoutMs: 8000, tag: `${host}:https` }),
        )
        const result = await runProbeInSandbox({ commonDir, plan, proxyPort: proxy.port })

        const successes = countConnectivitySuccesses({ results: result.results, hosts: GROUP_A_HOSTS })
        const summary = summarizeFailures({ results: result.results, hosts: GROUP_A_HOSTS })

        expect(
            successes >= MIN_GROUP_A_SUCCESSES,
            `expected >= ${MIN_GROUP_A_SUCCESSES}/${GROUP_A_HOSTS.length} hosts reachable through the proxy; got ${successes}.\n${summary}`,
        ).toBe(true)
    }, 120_000)

    it.skipIf(PRIVILEGE_SKIP)('Group B — multi-record / Cloudflare-fronted hosts reach origin through the proxy', async (ctx) => {
        if (internetSkip) ctx.skip()
        const plan = GROUP_B_HOSTS.map<ProbeAction>((host) =>
            ({ type: 'https-head-via-proxy', url: `https://${host}/`, timeoutMs: 8000, tag: `${host}:https` }),
        )
        const result = await runProbeInSandbox({ commonDir, plan, proxyPort: proxy.port })
        const successes = countConnectivitySuccesses({ results: result.results, hosts: GROUP_B_HOSTS })
        expect(successes, summarizeFailures({ results: result.results, hosts: GROUP_B_HOSTS })).toBeGreaterThanOrEqual(GROUP_B_HOSTS.length - 1)
    }, 60_000)

    it.skipIf(PRIVILEGE_SKIP)('Group E — globalThis.fetch via undici ProxyAgent reaches the same hosts (real code-piece path)', async (ctx) => {
        if (internetSkip) ctx.skip()
        // Smaller curated set: keeps the test deterministic while still exercising
        // multi-IP / IPv6-fronted / single-A-record DNS shapes.
        const plan: ProbeAction[] = GROUP_E_HOSTS.map((host) => ({
            type: 'fetch-via-undici', url: `https://${host}/`, method: 'HEAD', timeoutMs: 8000, tag: `${host}:fetch`,
        }))
        const result = await runProbeInSandbox({ commonDir, plan, proxyPort: proxy.port })
        const fetchResults = result.results.filter((r) => r.action.type === 'fetch-via-undici')
        const okCount = fetchResults.filter((r) => r.status === 'OK').length
        const summary = fetchResults
            .filter((r) => r.status !== 'OK')
            .map((r) => `  ${r.action.tag} → code=${r.code} cause=${r.causeMessage ?? r.message}`)
            .join('\n')
        expect(
            okCount >= Math.ceil(GROUP_E_HOSTS.length * 0.8),
            `expected >= 80% of hosts reachable via globalThis.fetch+ProxyAgent; got ${okCount}/${GROUP_E_HOSTS.length}.\n${summary}`,
        ).toBe(true)
    }, 90_000)

    it.skipIf(PRIVILEGE_SKIP)('Group F — bug repro: STRICT netns WITHOUT AP_EGRESS_PROXY_URL → fetch fails (no route) on every host', async (ctx) => {
        if (internetSkip) ctx.skip()
        // Reproduces the symptom users see when STRICT-mode netns is in effect but the
        // engine never installed undici's ProxyAgent — typically because
        // AP_EGRESS_PROXY_URL didn't reach the sandbox env. fetch falls back to direct
        // connect, but ap-egress has no route off the /30, so the connect fails with
        // ENETUNREACH/EHOSTUNREACH wrapped in "fetch failed". Locking this failure mode
        // in keeps any future regression that drops the env var while the netns stays in
        // place failing LOUD against the real netns + proxy + undici stack.
        const plan: ProbeAction[] = GROUP_E_HOSTS.map((host) => ({
            type: 'fetch-via-undici', url: `https://${host}/`, method: 'HEAD', timeoutMs: 4000, tag: `${host}:fetch-noproxy`,
        }))
        const result = await runProbeInSandbox({ commonDir, plan, proxyPort: proxy.port, omitProxyUrl: true })
        const failures = result.results.filter((r) => r.action.type === 'fetch-via-undici')
        for (const r of failures) {
            expect(r.status, `${r.action.tag} unexpectedly succeeded with no ProxyAgent: ${JSON.stringify(r)}`).toBe('ERR')
            expect(
                r.code === 'EHOSTUNREACH' || r.code === 'ENETUNREACH' || r.code === 'FETCH_ERR',
                `${r.action.tag} expected no-route failure (netns has no default route), got: ${JSON.stringify(r)}`,
            ).toBe(true)
        }
    }, 60_000)

    it.skipIf(PRIVILEGE_SKIP)('Group D — SSRF defense-in-depth: cloud-metadata and loopback are blocked', async (ctx) => {
        if (internetSkip) ctx.skip()
        const plan: ProbeAction[] = [
            { type: 'https-head-via-proxy', url: 'https://169.254.169.254/', timeoutMs: 5000, tag: 'aws-imds:https' },
            { type: 'https-head-via-proxy', url: 'https://metadata.google.internal/', timeoutMs: 5000, tag: 'gcp-metadata:https' },
            { type: 'direct-tcp-connect', host: '127.0.0.1', port: 22, tag: 'loopback-ssh' },
            { type: 'direct-tcp-connect', host: '10.0.0.1', port: 80, tag: 'rfc1918' },
        ]
        const result = await runProbeInSandbox({ commonDir, plan, proxyPort: proxy.port })

        for (const r of result.results) {
            if (r.action.type === 'https-head-via-proxy') {
                expect(
                    r.status === 'ERR',
                    `${r.action.tag} must be rejected by the proxy/SSRF guard, got: ${JSON.stringify(r)}`,
                ).toBe(true)
            }
            else if (r.action.type === 'direct-tcp-connect') {
                expect(
                    r.status,
                    `${r.action.tag} must NOT be reachable; ap-egress has no route for a direct connect`,
                ).not.toBe('OK')
            }
        }
    }, 60_000)
})

function countConnectivitySuccesses({ results, hosts }: { results: ProbeResult[], hosts: readonly string[] }): number {
    let n = 0
    for (const host of hosts) {
        const httpsOk = results.some((r) => r.action.tag === `${host}:https` && r.status === 'OK')
        if (httpsOk) n += 1
    }
    return n
}

function summarizeFailures({ results, hosts }: { results: ProbeResult[], hosts: readonly string[] }): string {
    const lines: string[] = []
    for (const host of hosts) {
        const https = results.find((r) => r.action.tag === `${host}:https`)
        const httpsLabel = https?.status === 'OK' ? `https:${https.statusCode ?? 'OK'}` : `https:${https?.code ?? https?.status ?? 'missing'}`
        if (https?.status !== 'OK') {
            lines.push(`  ${host} → ${httpsLabel}`)
        }
    }
    return lines.length > 0 ? `failures:\n${lines.join('\n')}` : 'all hosts succeeded'
}

async function runProbeInSandbox({ commonDir, plan, proxyPort, omitProxyUrl }: {
    commonDir: string
    plan: ProbeAction[]
    proxyPort: number
    omitProxyUrl?: boolean
}): Promise<{ results: ProbeResult[] }> {
    const logger = silentLogger()
    const maker = isolateProcess(logger, path.join(commonDir, 'egress-probe.js'), commonDir, BOX_ID, 'ap-egress')
    const proxyUrl = `http://${GATEWAY_HOST}:${proxyPort}`
    const baseEnv: Record<string, string> = {
        HOME: '/tmp/',
        NODE_PATH: '/usr/src/node_modules',
        AP_EXECUTION_MODE: 'SANDBOX_PROCESS',
        AP_SANDBOX_WS_PORT: '0',
        AP_SANDBOX_WS_TOKEN: 'e2e-token-aaaaaaaaaaaaaaaaaaaaaaaa',
        AP_BASE_CODE_DIRECTORY: '/root/codes',
        SANDBOX_ID: 'e2e-real-3p',
        AP_NETWORK_MODE: 'STRICT',
        AP_UNDICI_REQUIRE_PATH: '/root/common/undici',
        AP_PROBE_PLAN: JSON.stringify(plan),
    }
    if (!omitProxyUrl) baseEnv.AP_EGRESS_PROXY_URL = proxyUrl
    const child = await maker.create({
        sandboxId: 'e2e-real-3p',
        command: [],
        mounts: [
            { hostPath: commonDir, sandboxPath: '/root/common' },
        ],
        env: baseEnv,
        resourceLimits: { memoryLimitMb: 256, cpuMsPerSec: 4000, timeLimitSeconds: 90 },
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
    return JSON.parse(jsonLine)
}

const GROUP_A_HOSTS = [
    'api.openai.com',
    'api.anthropic.com',
    'api.github.com',
    'api.stripe.com',
    'api.notion.com',
    'api.hubapi.com',
    'slack.com',
    'api.airtable.com',
    'api.dropboxapi.com',
    'api.box.com',
    'graph.microsoft.com',
    'sheets.googleapis.com',
    'api.twilio.com',
    'api.sendgrid.com',
    'discord.com',
    'api.figma.com',
    'api.zoom.us',
    'api.pagerduty.com',
    'api.pipedrive.com',
    'api.xero.com',
    'a.klaviyo.com',
    'api.cohere.com',
    'api.mistral.ai',
    'api.groq.com',
    'api.assemblyai.com',
    'api.webflow.com',
    'api.line.me',
    'api.telnyx.com',
    'gateway.ai.cloudflare.com',
    'api.pandadoc.com',
] as const

const GROUP_B_HOSTS = [
    'cloudflare.com',
    'notion.so',
    'www.figma.com',
] as const

// Curated for the fetch-via-undici suite: diverse DNS shapes (multi-A only,
// Cloudflare-fronted v6+v4, AWS v6+v4, Google Cloud-front) so a regression in
// any one DNS family is visible without being host-specific.
const GROUP_E_HOSTS = [
    'api.airtable.com',
    'api.github.com',
    'api.stripe.com',
    'api.openai.com',
    'hooks.slack.com',
    'graph.microsoft.com',
] as const

const MIN_GROUP_A_SUCCESSES = Math.ceil(GROUP_A_HOSTS.length * 0.8)

async function mirrorUndiciInto(commonDir: string): Promise<void> {
    const undiciRoot = await locateUndiciRoot()
    const dest = path.join(commonDir, 'undici')
    // -L so any symlinks (bun's symlink farm) are dereferenced — the sandbox mount
    // must hold real files, not links into the worker host's /usr/src/app/node_modules.
    const r = spawnSync('cp', ['-RL', undiciRoot + '/.', dest], { encoding: 'utf8' })
    if (r.status !== 0) throw new Error(`failed to copy undici from ${undiciRoot} → ${dest}: ${r.stderr}`)
    spawnSync('chmod', ['-R', 'a+rX', dest])
}

async function locateUndiciRoot(): Promise<string> {
    // Engine ships undici 7.x, bundled at build time. Inside the e2e docker image,
    // bun installs each package version under node_modules/.bun/<name>@<ver>/.../<name>.
    // Try the engine version first (matches what real code-pieces use), then any version.
    const candidates = [
        '/usr/src/app/node_modules/.bun/undici@7.24.6/node_modules/undici',
    ]
    const globResult = spawnSync('bash', ['-c', 'ls -d /usr/src/app/node_modules/.bun/undici@*/node_modules/undici 2>/dev/null | head -1'], { encoding: 'utf8' })
    if (globResult.stdout.trim()) candidates.push(globResult.stdout.trim())
    for (const c of candidates) {
        const { error } = await tryStat(path.join(c, 'package.json'))
        if (!error) return c
    }
    throw new Error(`undici package not found in any of: ${candidates.join(', ')} — ensure the worker test image has bun-installed undici`)
}

async function tryStat(p: string): Promise<{ error?: Error }> {
    try { await stat(p); return {} } catch (e) { return { error: e as Error } }
}

type ProbeAction =
    | { type: 'dns-lookup', hostname: string, tag: string }
    | { type: 'dns-lookup-v6', hostname: string, tag: string }
    | { type: 'https-head-via-proxy', url: string, timeoutMs: number, tag: string }
    | { type: 'direct-tcp-connect', host: string, port: number, tag: string }
    | { type: 'fetch-via-undici', url: string, method?: string, timeoutMs?: number, tag: string }

type ProbeResult = {
    action: ProbeAction
    status?: 'OK' | 'ERR' | 'TIMEOUT'
    statusCode?: number
    code?: string
    message?: string
    causeMessage?: string
    address?: string
    elapsedMs?: number
}
