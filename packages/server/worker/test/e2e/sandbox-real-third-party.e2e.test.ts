import { chmod, copyFile, mkdtemp } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { iptablesLockdown, IptablesLockdown } from '../../src/lib/egress/iptables-lockdown'
import { egressInternals } from '../../src/lib/egress/lifecycle'
import { EgressProxy, startEgressProxy } from '../../src/lib/egress/proxy'
import { sandboxCapacity } from '../../src/lib/sandbox/capacity'
import { getIsolateExecutableName, isolateProcess } from '../../src/lib/sandbox/isolate'
import { requireOutboundInternet } from './helpers/outbound-internet-guard'
import { requireIsolateBinary, requireLinuxPrivileged } from './helpers/privilege-guard'
import { silentLogger } from './helpers/silent-logger'

/**
 * Reaches out to a curated list of real, public third-party API hosts from inside
 * the production-shaped stack: SANDBOX_PROCESS + STRICT + iptables lockdown +
 * egress proxy + sandbox-resolv-conf-aware DNS allowlist.
 *
 * The purpose is regression coverage for the 2026-05-06 outage class: any future
 * change that breaks DNS / proxy CONNECT / TLS / iptables for the sandbox will
 * fail this suite *before* it ships.
 */

const BOX_ID = 0
const SANDBOX_UID = sandboxCapacity.firstBoxUid + BOX_ID
const ISOLATE_BINARY_PATH = path.resolve(process.cwd(), 'packages/server/api/src/assets', getIsolateExecutableName())

const PRIVILEGE_SKIP = requireLinuxPrivileged() ?? requireIsolateBinary(ISOLATE_BINARY_PATH)

describe.skipIf(PRIVILEGE_SKIP)('sandbox real third-party connectivity (SANDBOX_PROCESS + STRICT)', () => {
    let proxy: EgressProxy
    let lockdown: IptablesLockdown | null = null
    let commonDir: string
    let internetSkip: { skip: true, reason: string } | undefined

    beforeAll(async () => {
        internetSkip = await requireOutboundInternet()
        if (internetSkip) return

        proxy = await startEgressProxy({
            log: silentLogger(),
            allowList: [],
        })

        const sandboxNameservers = await egressInternals.listSandboxResolvConfNameservers()
        const unionedAllowList = [...new Set(['1.1.1.1', '8.8.8.8', ...sandboxNameservers])]

        lockdown = await iptablesLockdown.apply({
            log: silentLogger(),
            proxyPort: proxy.port,
            firstBoxUid: SANDBOX_UID,
            numBoxes: 1,
            nameservers: unionedAllowList,
        })

        commonDir = await mkdtemp(path.join(tmpdir(), 'ap-real-3p-'))
        const probeDst = path.join(commonDir, 'egress-probe.js')
        await copyFile(path.resolve(__dirname, 'fixtures/egress-probe.js'), probeDst)
        await chmod(commonDir, 0o755)
        await chmod(probeDst, 0o644)
    }, 60_000)

    afterAll(async () => {
        if (lockdown) await lockdown.remove()
        if (proxy) await proxy.close()
    })

    it.skipIf(PRIVILEGE_SKIP)('Group A — at least 80% of curated third-party APIs reach DNS+TLS+HTTP through the proxy', async (ctx) => {
        if (internetSkip) ctx.skip()
        const plan = GROUP_A_HOSTS.flatMap<ProbeAction>((host) => [
            { type: 'dns-lookup', hostname: host, tag: `${host}:dns` },
            { type: 'https-head-via-proxy', url: `https://${host}/`, timeoutMs: 8000, tag: `${host}:https` },
        ])
        const result = await runProbeInSandbox({ commonDir, plan, proxyPort: proxy.port })

        const successes = countConnectivitySuccesses({ results: result.results, hosts: GROUP_A_HOSTS })
        const summary = summarizeFailures({ results: result.results, hosts: GROUP_A_HOSTS })

        expect(
            successes >= MIN_GROUP_A_SUCCESSES,
            `expected >= ${MIN_GROUP_A_SUCCESSES}/${GROUP_A_HOSTS.length} hosts reachable through the proxy; got ${successes}.\n${summary}`,
        ).toBe(true)

        const eaiAgain = result.results.filter((r) => r.code === 'EAI_AGAIN')
        expect(
            eaiAgain.length,
            `EAI_AGAIN must never appear — that is the production outage signature. Hosts: ${eaiAgain.map((r) => r.action.tag).join(', ')}`,
        ).toBe(0)
    }, 120_000)

    it.skipIf(PRIVILEGE_SKIP)('Group B — multi-record / Cloudflare-fronted hosts resolve and reach origin', async (ctx) => {
        if (internetSkip) ctx.skip()
        const plan = GROUP_B_HOSTS.flatMap<ProbeAction>((host) => [
            { type: 'dns-lookup', hostname: host, tag: `${host}:dns` },
            { type: 'https-head-via-proxy', url: `https://${host}/`, timeoutMs: 8000, tag: `${host}:https` },
        ])
        const result = await runProbeInSandbox({ commonDir, plan, proxyPort: proxy.port })
        const successes = countConnectivitySuccesses({ results: result.results, hosts: GROUP_B_HOSTS })
        expect(successes, summarizeFailures({ results: result.results, hosts: GROUP_B_HOSTS })).toBeGreaterThanOrEqual(GROUP_B_HOSTS.length - 1)
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
                    `${r.action.tag} must NOT be reachable; iptables should REJECT direct connect`,
                ).not.toBe('OK')
            }
        }
    }, 60_000)
})

function countConnectivitySuccesses({ results, hosts }: { results: ProbeResult[], hosts: readonly string[] }): number {
    let n = 0
    for (const host of hosts) {
        const dnsOk = results.some((r) => r.action.tag === `${host}:dns` && r.status === 'OK')
        const httpsOk = results.some((r) => r.action.tag === `${host}:https` && r.status === 'OK')
        if (dnsOk && httpsOk) n += 1
    }
    return n
}

function summarizeFailures({ results, hosts }: { results: ProbeResult[], hosts: readonly string[] }): string {
    const lines: string[] = []
    for (const host of hosts) {
        const dns = results.find((r) => r.action.tag === `${host}:dns`)
        const https = results.find((r) => r.action.tag === `${host}:https`)
        const dnsLabel = dns?.status === 'OK' ? 'dns:OK' : `dns:${dns?.code ?? dns?.status ?? 'missing'}`
        const httpsLabel = https?.status === 'OK' ? `https:${https.statusCode ?? 'OK'}` : `https:${https?.code ?? https?.status ?? 'missing'}`
        if (dns?.status !== 'OK' || https?.status !== 'OK') {
            lines.push(`  ${host} → ${dnsLabel} ${httpsLabel}`)
        }
    }
    return lines.length > 0 ? `failures:\n${lines.join('\n')}` : 'all hosts succeeded'
}

async function runProbeInSandbox({ commonDir, plan, proxyPort }: {
    commonDir: string
    plan: ProbeAction[]
    proxyPort: number
}): Promise<{ results: ProbeResult[] }> {
    const logger = silentLogger()
    const maker = isolateProcess(logger, path.join(commonDir, 'egress-probe.js'), commonDir, BOX_ID)
    const proxyUrl = `http://127.0.0.1:${proxyPort}`
    const child = await maker.create({
        sandboxId: 'e2e-real-3p',
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
            SANDBOX_ID: 'e2e-real-3p',
            AP_NETWORK_MODE: 'STRICT',
            AP_EGRESS_PROXY_URL: proxyUrl,
            AP_PROBE_PLAN: JSON.stringify(plan),
        },
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

const MIN_GROUP_A_SUCCESSES = Math.ceil(GROUP_A_HOSTS.length * 0.8)

type ProbeAction =
    | { type: 'dns-lookup', hostname: string, tag: string }
    | { type: 'dns-lookup-v6', hostname: string, tag: string }
    | { type: 'https-head-via-proxy', url: string, timeoutMs: number, tag: string }
    | { type: 'direct-tcp-connect', host: string, port: number, tag: string }

type ProbeResult = {
    action: ProbeAction
    status?: 'OK' | 'ERR' | 'TIMEOUT'
    statusCode?: number
    code?: string
    message?: string
    address?: string
    elapsedMs?: number
}
