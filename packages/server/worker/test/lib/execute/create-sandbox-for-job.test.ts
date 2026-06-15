import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ApEnvironment, ExecutionMode, NetworkMode } from '@activepieces/shared'

const { getSettingsMock, createSandboxMock, isolateProcessMock, simpleProcessMock, getGlobalCacheCommonPathMock, getGlobalCodeCachePathMock, getEnginePathMock } = vi.hoisted(() => ({
    getSettingsMock: vi.fn(),
    createSandboxMock: vi.fn(),
    isolateProcessMock: vi.fn(() => ({ create: vi.fn() })),
    simpleProcessMock: vi.fn(() => ({ create: vi.fn() })),
    getGlobalCacheCommonPathMock: vi.fn(() => '/tmp/cache/common'),
    getGlobalCodeCachePathMock: vi.fn(() => '/tmp/cache/codes'),
    getEnginePathMock: vi.fn(() => '/tmp/cache/common/main.js'),
}))

vi.mock('../../../src/lib/config/worker-settings', () => ({
    workerSettings: {
        getSettings: (...args: unknown[]) => getSettingsMock(...args),
    },
}))

vi.mock('../../../src/lib/sandbox/sandbox', () => ({
    createSandbox: createSandboxMock,
}))

vi.mock('../../../src/lib/sandbox/isolate', () => ({
    isolateProcess: isolateProcessMock,
}))

vi.mock('../../../src/lib/sandbox/fork', () => ({
    simpleProcess: simpleProcessMock,
}))

vi.mock('../../../src/lib/cache/cache-paths', () => ({
    getGlobalCacheCommonPath: getGlobalCacheCommonPathMock,
    getGlobalCodeCachePath: getGlobalCodeCachePathMock,
    getEnginePath: getEnginePathMock,
}))

import { createSandboxForJob } from '../../../src/lib/execute/create-sandbox-for-job'

type Settings = {
    PUBLIC_URL: string
    TRIGGER_TIMEOUT_SECONDS: number
    TRIGGER_HOOKS_TIMEOUT_SECONDS: number
    PAUSED_FLOW_TIMEOUT_DAYS: number
    EXECUTION_MODE: string
    FLOW_TIMEOUT_SECONDS: number
    LOG_LEVEL: string
    LOG_PRETTY: string
    ENVIRONMENT: string
    APP_WEBHOOK_SECRETS: string
    MAX_FLOW_RUN_LOG_SIZE_MB: number
    MAX_FILE_SIZE_MB: number
    SANDBOX_MEMORY_LIMIT: string
    SANDBOX_PROPAGATED_ENV_VARS: string[]
    DEV_PIECES: string[]
    OTEL_ENABLED: boolean
    FILE_STORAGE_LOCATION: string
    S3_USE_SIGNED_URLS: string
    EVENT_DESTINATION_TIMEOUT_SECONDS: number
    EDITION: string
    NETWORK_MODE: NetworkMode
    SSRF_ALLOW_LIST: string[]
}

function buildSettings(overrides: Partial<Settings> = {}): Settings {
    const base: Settings = {
        PUBLIC_URL: 'http://localhost:3000',
        TRIGGER_TIMEOUT_SECONDS: 60,
        TRIGGER_HOOKS_TIMEOUT_SECONDS: 60,
        PAUSED_FLOW_TIMEOUT_DAYS: 30,
        EXECUTION_MODE: ExecutionMode.SANDBOX_PROCESS,
        FLOW_TIMEOUT_SECONDS: 600,
        LOG_LEVEL: 'info',
        LOG_PRETTY: 'false',
        ENVIRONMENT: ApEnvironment.PRODUCTION,
        APP_WEBHOOK_SECRETS: '{}',
        MAX_FLOW_RUN_LOG_SIZE_MB: 10,
        MAX_FILE_SIZE_MB: 10,
        SANDBOX_MEMORY_LIMIT: '1048576',
        SANDBOX_PROPAGATED_ENV_VARS: [],
        DEV_PIECES: [],
        OTEL_ENABLED: false,
        FILE_STORAGE_LOCATION: '/tmp',
        S3_USE_SIGNED_URLS: 'false',
        EVENT_DESTINATION_TIMEOUT_SECONDS: 30,
        EDITION: 'community',
        NETWORK_MODE: NetworkMode.UNRESTRICTED,
        SSRF_ALLOW_LIST: [],
    }
    return { ...base, ...overrides }
}

const log = { info: vi.fn(), debug: vi.fn(), warn: vi.fn(), error: vi.fn(), child: vi.fn() } as never
const apiClient = {} as never

const GATEWAY_HOST = '10.255.0.1'
const UNRESTRICTED_EGRESS = { proxyPort: null, gatewayHost: null, netnsName: null }
function strictEgress(proxyPort: number): { proxyPort: number, gatewayHost: string, netnsName: string } {
    return { proxyPort, gatewayHost: GATEWAY_HOST, netnsName: 'ap-egress' }
}

describe('createSandboxForJob', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        createSandboxMock.mockReturnValue({ id: 'sb', start: vi.fn(), execute: vi.fn(), shutdown: vi.fn(), isReady: vi.fn() })
    })

    describe('baseMounts', () => {
        it('contains exactly /root/common → getGlobalCacheCommonPath()', () => {
            getSettingsMock.mockReturnValue(buildSettings())
            createSandboxForJob({ log, apiClient, boxId: 1, reusable: false, egress: UNRESTRICTED_EGRESS })

            const options = createSandboxMock.mock.calls[0][2]
            expect(options.baseMounts).toEqual([
                { hostPath: '/tmp/cache/common', sandboxPath: '/root/common' },
            ])
        })

        it('never leaks host / or /etc into baseMounts', () => {
            getSettingsMock.mockReturnValue(buildSettings())
            createSandboxForJob({ log, apiClient, boxId: 1, reusable: false, egress: UNRESTRICTED_EGRESS })

            const options = createSandboxMock.mock.calls[0][2]
            for (const mount of options.baseMounts) {
                expect(mount.hostPath).not.toBe('/')
                expect(mount.hostPath).not.toBe('/etc')
                expect(mount.sandboxPath.startsWith('/root/') || mount.sandboxPath === '/root').toBe(true)
            }
        })
    })

    describe('processMaker selection', () => {
        it.each([
            [ExecutionMode.SANDBOX_PROCESS, 'isolate'],
            [ExecutionMode.SANDBOX_CODE_AND_PROCESS, 'isolate'],
        ])('uses isolateProcess for %s', (executionMode) => {
            getSettingsMock.mockReturnValue(buildSettings({ EXECUTION_MODE: executionMode }))
            createSandboxForJob({ log, apiClient, boxId: 7, reusable: false, egress: UNRESTRICTED_EGRESS })

            expect(isolateProcessMock).toHaveBeenCalledTimes(1)
            expect(simpleProcessMock).not.toHaveBeenCalled()
            expect(isolateProcessMock).toHaveBeenCalledWith(log, '/tmp/cache/common/main.js', '/tmp/cache/codes', 7, undefined)
        })

        it.each([
            [ExecutionMode.UNSANDBOXED, 'simple'],
            [ExecutionMode.SANDBOX_CODE_ONLY, 'simple'],
        ])('uses simpleProcess for %s', (executionMode) => {
            getSettingsMock.mockReturnValue(buildSettings({ EXECUTION_MODE: executionMode }))
            createSandboxForJob({ log, apiClient, boxId: 3, reusable: false, egress: UNRESTRICTED_EGRESS })

            expect(simpleProcessMock).toHaveBeenCalledTimes(1)
            expect(isolateProcessMock).not.toHaveBeenCalled()
            expect(simpleProcessMock).toHaveBeenCalledWith('/tmp/cache/common/main.js', '/tmp/cache/codes')
        })
    })

    describe('buildSandboxEnv', () => {
        it('emits all required keys including NODE_PATH (STRICT when egress gateway is set)', () => {
            getSettingsMock.mockReturnValue(buildSettings({
                EXECUTION_MODE: ExecutionMode.SANDBOX_PROCESS,
                MAX_FLOW_RUN_LOG_SIZE_MB: 25,
                MAX_FILE_SIZE_MB: 50,
                NETWORK_MODE: NetworkMode.STRICT,
            }))
            createSandboxForJob({ log, apiClient, boxId: 1, reusable: false, egress: strictEgress(49321) })

            const env = createSandboxMock.mock.calls[0][2].env
            expect(env).toMatchObject({
                HOME: '/tmp/',
                AP_EXECUTION_MODE: ExecutionMode.SANDBOX_PROCESS,
                AP_MAX_FLOW_RUN_LOG_SIZE_MB: '25',
                AP_MAX_FILE_SIZE_MB: '50',
                NODE_PATH: '/usr/src/node_modules',
                AP_NETWORK_MODE: NetworkMode.STRICT,
                AP_EGRESS_PROXY_URL: `http://${GATEWAY_HOST}:49321`,
                AP_SANDBOX_WS_HOST: GATEWAY_HOST,
            })
        })

        it('threads the netns name into isolateProcess and allowlists the gateway in STRICT', () => {
            getSettingsMock.mockReturnValue(buildSettings({
                EXECUTION_MODE: ExecutionMode.SANDBOX_PROCESS,
                NETWORK_MODE: NetworkMode.STRICT,
                SSRF_ALLOW_LIST: ['1.2.3.4'],
            }))
            createSandboxForJob({ log, apiClient, boxId: 2, reusable: false, egress: strictEgress(49555) })

            expect(isolateProcessMock).toHaveBeenCalledWith(log, '/tmp/cache/common/main.js', '/tmp/cache/codes', 2, 'ap-egress')
            const options = createSandboxMock.mock.calls[0][2]
            expect(options.wsRpcHost).toBe(GATEWAY_HOST)
            expect(options.env.AP_SSRF_ALLOW_LIST.split(',')).toEqual(['1.2.3.4', GATEWAY_HOST])
        })

        it('omits AP_DEV_PIECES when DEV_PIECES is empty', () => {
            getSettingsMock.mockReturnValue(buildSettings({ DEV_PIECES: [] }))
            createSandboxForJob({ log, apiClient, boxId: 1, reusable: false, egress: UNRESTRICTED_EGRESS })

            const env = createSandboxMock.mock.calls[0][2].env
            expect(env.AP_DEV_PIECES).toBeUndefined()
        })

        it('joins DEV_PIECES with comma', () => {
            getSettingsMock.mockReturnValue(buildSettings({ DEV_PIECES: ['a', 'b', 'c'] }))
            createSandboxForJob({ log, apiClient, boxId: 1, reusable: false, egress: UNRESTRICTED_EGRESS })

            const env = createSandboxMock.mock.calls[0][2].env
            expect(env.AP_DEV_PIECES).toBe('a,b,c')
        })

        it('only propagates env vars that exist in process.env (no undefined leak)', () => {
            const originalProcessEnv = { ...process.env }
            try {
                process.env.PROPAGATED_YES = 'forwarded'
                delete process.env.PROPAGATED_NO
                getSettingsMock.mockReturnValue(buildSettings({
                    SANDBOX_PROPAGATED_ENV_VARS: ['PROPAGATED_YES', 'PROPAGATED_NO'],
                }))
                createSandboxForJob({ log, apiClient, boxId: 1, reusable: false, egress: UNRESTRICTED_EGRESS })

                const env = createSandboxMock.mock.calls[0][2].env
                expect(env.PROPAGATED_YES).toBe('forwarded')
                expect('PROPAGATED_NO' in env).toBe(false)
            }
            finally {
                process.env = originalProcessEnv
            }
        })
    })

    describe('parseMemoryLimit', () => {
        it('converts KB string to MB', () => {
            getSettingsMock.mockReturnValue(buildSettings({ SANDBOX_MEMORY_LIMIT: '524288' }))
            createSandboxForJob({ log, apiClient, boxId: 1, reusable: false, egress: UNRESTRICTED_EGRESS })

            expect(createSandboxMock.mock.calls[0][2].memoryLimitMb).toBe(512)
        })

        it('defaults to 1024 MB on invalid input', () => {
            getSettingsMock.mockReturnValue(buildSettings({ SANDBOX_MEMORY_LIMIT: 'not-a-number' }))
            createSandboxForJob({ log, apiClient, boxId: 1, reusable: false, egress: UNRESTRICTED_EGRESS })

            expect(createSandboxMock.mock.calls[0][2].memoryLimitMb).toBe(1024)
        })
    })

    it('forwards reusable flag into createSandbox options', () => {
        getSettingsMock.mockReturnValue(buildSettings())
        createSandboxForJob({ log, apiClient, boxId: 1, reusable: true, egress: UNRESTRICTED_EGRESS })

        expect(createSandboxMock.mock.calls[0][2].reusable).toBe(true)
    })

    // The sandbox network env follows the egress stack's runtime state (gatewayHost),
    // not the live workerSettings.NETWORK_MODE. The stack starts once at worker boot;
    // settings refresh on every reconnect. Keying off the gateway prevents the
    // STRICT netns + missing AP_EGRESS_PROXY_URL drift that surfaces as
    // ENETUNREACH ("fetch failed") in user code-pieces.
    describe('sandbox network env follows the egress gateway, not live settings', () => {
        it('no gateway + NETWORK_MODE=STRICT in settings → engine sees UNRESTRICTED, no proxy URL', () => {
            // Drift scenario: settings flipped STRICT after boot but the egress stack
            // was never (re)started, so the netns isn't actually created. Telling the
            // engine it is would install ProxyAgent pointed at nothing.
            getSettingsMock.mockReturnValue(buildSettings({ NETWORK_MODE: NetworkMode.STRICT }))
            createSandboxForJob({ log, apiClient, boxId: 1, reusable: false, egress: UNRESTRICTED_EGRESS })

            const env = createSandboxMock.mock.calls[0][2].env
            expect(env.AP_NETWORK_MODE).toBe(NetworkMode.UNRESTRICTED)
            expect('AP_EGRESS_PROXY_URL' in env).toBe(false)
            expect('AP_SANDBOX_WS_HOST' in env).toBe(false)
        })

        it('gateway set + NETWORK_MODE=UNRESTRICTED in settings → engine sees STRICT, proxy URL set', () => {
            // Drift scenario users actually hit: settings flipped UNRESTRICTED after
            // boot, but the netns still exists and the proxy is still listening.
            // Engine MUST install ProxyAgent or every fetch fails with ENETUNREACH.
            getSettingsMock.mockReturnValue(buildSettings({ NETWORK_MODE: NetworkMode.UNRESTRICTED }))
            createSandboxForJob({ log, apiClient, boxId: 1, reusable: false, egress: strictEgress(49322) })

            const env = createSandboxMock.mock.calls[0][2].env
            expect(env.AP_NETWORK_MODE).toBe(NetworkMode.STRICT)
            expect(env.AP_EGRESS_PROXY_URL).toBe(`http://${GATEWAY_HOST}:49322`)
        })

        it('blocks HTTP_PROXY-style propagated env vars when STRICT is derived from the gateway, not settings', () => {
            const originalProcessEnv = { ...process.env }
            try {
                process.env.HTTP_PROXY = 'http://leak:3128'
                process.env.HTTPS_PROXY = 'http://leak:3128'
                getSettingsMock.mockReturnValue(buildSettings({
                    NETWORK_MODE: NetworkMode.UNRESTRICTED,
                    SANDBOX_PROPAGATED_ENV_VARS: ['HTTP_PROXY', 'HTTPS_PROXY'],
                }))
                createSandboxForJob({ log, apiClient, boxId: 1, reusable: false, egress: strictEgress(49323) })

                const env = createSandboxMock.mock.calls[0][2].env
                expect('HTTP_PROXY' in env).toBe(false)
                expect('HTTPS_PROXY' in env).toBe(false)
            }
            finally {
                process.env = originalProcessEnv
            }
        })
    })
})
