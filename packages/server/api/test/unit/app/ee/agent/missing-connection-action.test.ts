import Fastify from 'fastify'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { mockGetUserProjects, mockGetSelectedConnection, mockGetPieceMetadata, mockExecutePieceActionRun, mockRecordAgentAction } = vi.hoisted(() => ({
    mockGetUserProjects: vi.fn(),
    mockGetSelectedConnection: vi.fn(),
    mockGetPieceMetadata: vi.fn(),
    mockExecutePieceActionRun: vi.fn(),
    mockRecordAgentAction: vi.fn(),
}))

vi.mock('../../../../../src/app/ee/agent/agent-helpers', () => ({
    agentHelpers: { getUserProjects: mockGetUserProjects },
}))

vi.mock('../../../../../src/app/ee/agent/agent-approval-gate', () => ({
    agentApprovalGate: { getSelectedConnection: mockGetSelectedConnection },
}))

vi.mock('../../../../../src/app/pieces/metadata/piece-metadata-service', () => ({
    pieceMetadataService: () => ({ get: mockGetPieceMetadata }),
}))

vi.mock('../../../../../src/app/mcp/tools/flow-run-utils', async (importOriginal) => ({
    ...(await importOriginal<object>()),
    executePieceActionRun: mockExecutePieceActionRun,
}))

vi.mock('../../../../../src/app/ee/agent/rpc/rpc-shared', async (importOriginal) => ({
    ...(await importOriginal<object>()),
    recordAgentAction: mockRecordAgentAction,
}))

const silentLog = Fastify({ logger: false }).log

const gmailMetadata = {
    displayName: 'Gmail',
    auth: { type: 'OAUTH2' },
    actions: {
        gmail_search_mail: { displayName: 'Search Mail', requireAuth: true },
    },
}

async function exploreGmail(input: Record<string, unknown>) {
    const { executeCrossProjectTool } = await import('../../../../../src/app/ee/agent/tools/agent-tools')
    return executeCrossProjectTool({
        toolName: 'ap_explore_data',
        toolInput: { pieceName: '@activepieces/piece-gmail', actionName: 'gmail_search_mail', input },
        platformId: 'plat-1',
        userId: 'user-1',
        conversationId: 'conv-1',
        log: silentLog,
    })
}

describe('runAgentAction without a picked connection', () => {
    beforeEach(() => {
        mockGetUserProjects.mockResolvedValue([{ id: 'proj-1', displayName: 'Own', type: 'TEAM' }])
        mockGetPieceMetadata.mockResolvedValue(gmailMetadata)
        mockExecutePieceActionRun.mockReset()
        mockExecutePieceActionRun.mockResolvedValue({ content: [{ type: 'text', text: '✅ done' }] })
        mockGetSelectedConnection.mockReset()
    })

    it('tells the agent to open the connection picker and starts no run', async () => {
        mockGetSelectedConnection.mockResolvedValue(null)

        const result = await exploreGmail({ query: 'invoices' })

        expect(mockExecutePieceActionRun).not.toHaveBeenCalled()
        expect(result).toEqual({
            success: false,
            missingConnection: true,
            error: '❌ No Gmail account is selected in this conversation. Call ap_show_connection_picker for @activepieces/piece-gmail, then re-send this call. Retrying before that fails the same way.',
        })
    })

    it('runs when the call passes auth itself', async () => {
        mockGetSelectedConnection.mockResolvedValue(null)

        await exploreGmail({ query: 'invoices', auth: 'conn-ext-1' })

        expect(mockExecutePieceActionRun).toHaveBeenCalledTimes(1)
    })

    it('runs on the connection picked earlier in the conversation', async () => {
        mockGetSelectedConnection.mockResolvedValue({ externalId: 'conn-ext-1', label: 'me@example.com', projectId: 'proj-1' })

        await exploreGmail({ query: 'invoices' })

        expect(mockExecutePieceActionRun).toHaveBeenCalledWith(expect.objectContaining({ connectionExternalId: 'conn-ext-1' }))
    })

    it('runs an action that declares requireAuth false on a piece that has auth', async () => {
        mockGetSelectedConnection.mockResolvedValue(null)
        mockGetPieceMetadata.mockResolvedValue({ ...gmailMetadata, actions: { gmail_search_mail: { displayName: 'Search Mail', requireAuth: false } } })

        await exploreGmail({ query: 'invoices' })

        expect(mockExecutePieceActionRun).toHaveBeenCalledTimes(1)
    })
})

describe('__action_requires_auth', () => {
    async function requiresAuth(actions: Record<string, unknown>) {
        mockGetUserProjects.mockResolvedValue([{ id: 'proj-1', displayName: 'Own', type: 'TEAM' }])
        mockGetSelectedConnection.mockResolvedValue(null)
        mockGetPieceMetadata.mockResolvedValue({ ...gmailMetadata, actions })
        const { executeCrossProjectTool } = await import('../../../../../src/app/ee/agent/tools/agent-tools')
        return executeCrossProjectTool({
            toolName: '__action_requires_auth',
            toolInput: { pieceName: '@activepieces/piece-gmail', actionName: 'gmail_search_mail' },
            platformId: 'plat-1',
            userId: 'user-1',
            conversationId: 'conv-1',
            log: silentLog,
        })
    }

    it('reports whether the action declares it needs a connection', async () => {
        expect(await requiresAuth({ gmail_search_mail: { displayName: 'Search Mail', requireAuth: true } })).toBe(true)
        expect(await requiresAuth({ gmail_search_mail: { displayName: 'Search Mail', requireAuth: false } })).toBe(false)
    })

    it('answers null for an action it cannot find, so the worker does not block it', async () => {
        expect(await requiresAuth({})).toBeNull()
    })
})

describe('the missing-auth text the worker matches', () => {
    it('is what diagnosePieceProps reports for a piece call without auth', async () => {
        const { MISSING_AUTH_INPUT_TEXT } = await import('@activepieces/shared')
        const { mcpUtils } = await import('../../../../../src/app/mcp/tools/mcp-utils')

        const diagnosis = mcpUtils.diagnosePieceProps({ props: {}, input: {}, pieceAuth: gmailMetadata.auth, requireAuth: true, componentType: 'action' })

        expect(diagnosis.missing).toContain(MISSING_AUTH_INPUT_TEXT)
        expect(MISSING_AUTH_INPUT_TEXT).toContain('auth (connection required')
    })
})
