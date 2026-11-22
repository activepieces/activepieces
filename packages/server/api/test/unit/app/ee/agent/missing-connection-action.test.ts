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

const noopLogger = { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }

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
        log: noopLogger as never,
    } as never)
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

    it('runs an action that needs no account', async () => {
        mockGetSelectedConnection.mockResolvedValue(null)
        mockGetPieceMetadata.mockResolvedValue({ ...gmailMetadata, actions: { gmail_search_mail: { displayName: 'Search Mail', requireAuth: false } } })

        await exploreGmail({ query: 'invoices' })

        expect(mockExecutePieceActionRun).toHaveBeenCalledTimes(1)
    })
})
