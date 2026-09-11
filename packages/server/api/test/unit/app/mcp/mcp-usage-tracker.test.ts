import { ActivepiecesError, ErrorCode, PlatformUsageMetric } from '@activepieces/core-utils'
import { McpServerType, PopulatedMcpServer } from '@activepieces/shared'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { INTERNAL_CHAT_CLIENT_ID } from '../../../../src/app/mcp/mcp-clients'
import { MCP_CALL_CREDITS, mcpUsageTracker } from '../../../../src/app/mcp/mcp-usage-tracker'

const { mockTrackBillingAndSendTelemetry, mockGetOrCreateForPlatform, mockGetProject, mockAssertCredits } = vi.hoisted(() => ({
    mockTrackBillingAndSendTelemetry: vi.fn().mockResolvedValue(undefined),
    mockGetOrCreateForPlatform: vi.fn(),
    mockGetProject: vi.fn(),
    mockAssertCredits: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('../../../../src/app/platform/billing-provider', () => ({
    CreditUsageSource: { MCP: 'mcp' },
    assertCreditsAndAppSumoNotExceeded: mockAssertCredits,
}))

vi.mock('../../../../src/app/platform/billing-and-telemetry', () => ({
    trackBillingAndSendTelemetry: mockTrackBillingAndSendTelemetry,
}))

vi.mock('../../../../src/app/ee/platform/platform-plan/platform-plan.service', () => ({
    platformPlanService: () => ({ getOrCreateForPlatform: mockGetOrCreateForPlatform }),
}))

vi.mock('../../../../src/app/project/project-service', () => ({
    projectService: () => ({ getOneOrThrow: mockGetProject }),
}))

const log = { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }

const EXTERNAL_CLIENT_ID = 'claude-desktop'

function mcpServer(overrides: Partial<PopulatedMcpServer>): PopulatedMcpServer {
    const base: PopulatedMcpServer = {
        id: 'mcp-1',
        created: '2026-09-01T00:00:00.000Z',
        updated: '2026-09-01T00:00:00.000Z',
        platformId: null,
        projectId: null,
        type: McpServerType.PROJECT,
        token: 'token-1',
        disabledTools: [],
        flows: [],
    }
    return { ...base, ...overrides }
}

async function chargeOnce({ mcp, clientId, projectId }: { mcp: PopulatedMcpServer, clientId: string, projectId: string | null }): Promise<void> {
    const billing = await mcpUsageTracker(log as never).resolveCallBilling({ mcp, clientId })
    billing.charge({ toolName: 'ap_run_action', projectId })
    await flushPendingCharges()
}

function flushPendingCharges(): Promise<void> {
    return new Promise((resolve) => setImmediate(resolve))
}

describe('mcpUsageTracker.resolveCallBilling — charging', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        mockGetOrCreateForPlatform.mockResolvedValue({ plan: 'plus', licenseKey: null })
        mockGetProject.mockResolvedValue({ platformId: 'platform-1' })
        mockAssertCredits.mockResolvedValue(undefined)
    })

    it('charges one credit for an external client such as Claude or Cursor', async () => {
        await chargeOnce({ mcp: mcpServer({ projectId: 'project-1' }), clientId: EXTERNAL_CLIENT_ID, projectId: 'project-1' })

        const { credits } = mockTrackBillingAndSendTelemetry.mock.calls[0][0]
        expect(credits.value).toBe(MCP_CALL_CREDITS)
        expect(credits.source).toBe('mcp')
    })

    it('charges nothing for our own chat, which already pays per tool call', async () => {
        await chargeOnce({ mcp: mcpServer({ projectId: 'project-1' }), clientId: INTERNAL_CHAT_CLIENT_ID, projectId: 'project-1' })

        expect(mockTrackBillingAndSendTelemetry).not.toHaveBeenCalled()
    })

    it('resolves the platform from the project, since a project-scoped server stores no platform', async () => {
        await chargeOnce({ mcp: mcpServer({ projectId: 'project-1' }), clientId: EXTERNAL_CLIENT_ID, projectId: 'project-1' })

        expect(mockGetProject).toHaveBeenCalledWith('project-1')
        const { credits } = mockTrackBillingAndSendTelemetry.mock.calls[0][0]
        expect(credits.properties).toMatchObject({ platformId: 'platform-1', projectId: 'project-1', toolName: 'ap_run_action', clientId: EXTERNAL_CLIENT_ID })
    })

    it('bills a platform-scoped server without asking the project service', async () => {
        await chargeOnce({ mcp: mcpServer({ platformId: 'platform-2', type: McpServerType.PLATFORM }), clientId: EXTERNAL_CLIENT_ID, projectId: null })

        expect(mockGetProject).not.toHaveBeenCalled()
        const { credits } = mockTrackBillingAndSendTelemetry.mock.calls[0][0]
        expect(credits.properties).toMatchObject({ platformId: 'platform-2', projectId: null })
    })

    it('charges nothing when neither a platform nor a project names an owner to bill', async () => {
        await chargeOnce({ mcp: mcpServer({}), clientId: EXTERNAL_CLIENT_ID, projectId: null })

        expect(mockTrackBillingAndSendTelemetry).not.toHaveBeenCalled()
        expect(log.warn).toHaveBeenCalled()
    })

    it('gives every call its own key, so a client calling the same tool twice pays twice', async () => {
        const billing = await mcpUsageTracker(log as never).resolveCallBilling({ mcp: mcpServer({ platformId: 'platform-2', type: McpServerType.PLATFORM }), clientId: EXTERNAL_CLIENT_ID })
        billing.charge({ toolName: 'ap_run_action', projectId: null })
        billing.charge({ toolName: 'ap_run_action', projectId: null })
        await flushPendingCharges()
        expect(mockTrackBillingAndSendTelemetry).toHaveBeenCalledTimes(2)

        const [first, second] = mockTrackBillingAndSendTelemetry.mock.calls
        expect(first[0].credits.idempotencyKey).not.toBe(second[0].credits.idempotencyKey)
    })

    it('charges AppSumo credits alongside the platform balance on a credited plan', async () => {
        mockGetOrCreateForPlatform.mockResolvedValue({ plan: 'appsumo_activepieces_tier1', licenseKey: null })

        await chargeOnce({ mcp: mcpServer({ platformId: 'platform-2', type: McpServerType.PLATFORM }), clientId: EXTERNAL_CLIENT_ID, projectId: null })

        const { appSumo } = mockTrackBillingAndSendTelemetry.mock.calls[0][0]
        expect(appSumo?.value).toBe(MCP_CALL_CREDITS)
    })

    it('lets the call through when billing fails, rather than failing the tool', async () => {
        mockTrackBillingAndSendTelemetry.mockRejectedValueOnce(new Error('autumn is down'))

        await chargeOnce({ mcp: mcpServer({ platformId: 'platform-2', type: McpServerType.PLATFORM }), clientId: EXTERNAL_CLIENT_ID, projectId: null })

        expect(log.warn).toHaveBeenCalled()
    })
})

async function refusalFor({ mcp, clientId }: { mcp: PopulatedMcpServer, clientId: string }) {
    const billing = await mcpUsageTracker(log as never).resolveCallBilling({ mcp, clientId })
    return billing.refusalWhenOutOfCredits({ toolName: 'ap_run_action' })
}

const OUT_OF_CREDITS = new ActivepiecesError({ code: ErrorCode.QUOTA_EXCEEDED, params: { metric: PlatformUsageMetric.CREDITS } })

describe('mcpUsageTracker.resolveCallBilling — refusing a client with no credits left', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        mockGetOrCreateForPlatform.mockResolvedValue({ plan: 'plus', licenseKey: null })
        mockGetProject.mockResolvedValue({ platformId: 'platform-1' })
        mockAssertCredits.mockResolvedValue(undefined)
    })

    it('lets the call through while the platform still has credits', async () => {
        const refusal = await refusalFor({ mcp: mcpServer({ projectId: 'project-1' }), clientId: EXTERNAL_CLIENT_ID })

        expect(refusal).toBeNull()
    })

    it('refuses an external client once the platform is out of credits, as chat already does', async () => {
        mockAssertCredits.mockRejectedValue(OUT_OF_CREDITS)

        const refusal = await refusalFor({ mcp: mcpServer({ projectId: 'project-1' }), clientId: EXTERNAL_CLIENT_ID })

        expect(refusal?.isError).toBe(true)
        expect(refusal?.content[0].text).toContain('Out of credits')
    })

    it('names the tool in the refusal, so the client can report what it could not run', async () => {
        mockAssertCredits.mockRejectedValue(OUT_OF_CREDITS)

        const refusal = await refusalFor({ mcp: mcpServer({ projectId: 'project-1' }), clientId: EXTERNAL_CLIENT_ID })

        expect(refusal?.content[0].text).toContain('ap_run_action')
    })

    it('never refuses our own chat, which the conversation endpoint has already gated', async () => {
        mockAssertCredits.mockRejectedValue(OUT_OF_CREDITS)

        const refusal = await refusalFor({ mcp: mcpServer({ projectId: 'project-1' }), clientId: INTERNAL_CHAT_CLIENT_ID })

        expect(refusal).toBeNull()
        expect(mockAssertCredits).not.toHaveBeenCalled()
    })

    it('lets the call through when the credits lookup itself fails, rather than taking the tool down', async () => {
        mockAssertCredits.mockRejectedValue(new Error('autumn is down'))

        const refusal = await refusalFor({ mcp: mcpServer({ projectId: 'project-1' }), clientId: EXTERNAL_CLIENT_ID })

        expect(refusal).toBeNull()
        expect(log.warn).toHaveBeenCalled()
    })

    it('checks credits against the platform the project belongs to', async () => {
        await refusalFor({ mcp: mcpServer({ projectId: 'project-1' }), clientId: EXTERNAL_CLIENT_ID })

        expect(mockAssertCredits).toHaveBeenCalledWith(expect.objectContaining({ platformId: 'platform-1' }))
    })
})
