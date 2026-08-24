import { Permission } from '@activepieces/core-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const {
    mockGetUserProjects,
    mockGetConversationOrThrow,
    mockGetBoolean,
    mockGetOrCreateForPlatform,
    mockCheck,
    mockCreate,
    mockList,
} = vi.hoisted(() => ({
    mockGetUserProjects: vi.fn(),
    mockGetConversationOrThrow: vi.fn(),
    mockGetBoolean: vi.fn(),
    mockGetOrCreateForPlatform: vi.fn(),
    mockCheck: vi.fn(),
    mockCreate: vi.fn(),
    mockList: vi.fn(),
}))

vi.mock('../../../../../src/app/ee/agent/agent-helpers', () => ({
    agentHelpers: {
        getUserProjects: mockGetUserProjects,
        getConversationOrThrow: mockGetConversationOrThrow,
    },
}))

vi.mock('../../../../../src/app/helper/system/system', async (importOriginal) => {
    const actual = await importOriginal<typeof import('../../../../../src/app/helper/system/system')>()
    return { ...actual, system: { ...actual.system, getBoolean: mockGetBoolean } }
})

vi.mock('../../../../../src/app/ee/platform/platform-plan/platform-plan.service', () => ({
    platformPlanService: () => ({ getOrCreateForPlatform: mockGetOrCreateForPlatform }),
}))

vi.mock('../../../../../src/app/mcp/mcp-permissions', () => ({
    resolvePermissionChecker: async () => ({ check: mockCheck }),
}))

vi.mock('../../../../../src/app/ee/agent/agent-service', () => ({
    agentService: () => ({ create: mockCreate, list: mockList }),
}))

const noopLogger = { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }

const CREATE_INPUT = { displayName: 'Inbox triage', instructions: 'Sort the inbox every morning.' }

async function runTool(toolName: string, toolInput: Record<string, unknown> = {}) {
    const { executeCrossProjectTool } = await import('../../../../../src/app/ee/agent/tools/agent-tools')
    return executeCrossProjectTool({
        toolName,
        toolInput,
        platformId: 'plat-1',
        userId: 'user-1',
        conversationId: 'conv-1',
        log: noopLogger as never,
    } as never)
}

describe('the chat tools that build agents', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        mockGetUserProjects.mockResolvedValue([{ id: 'proj-1', displayName: 'Own', type: 'TEAM' }])
        mockGetConversationOrThrow.mockResolvedValue({ projectId: 'proj-1' })
        mockGetBoolean.mockReturnValue(true)
        mockGetOrCreateForPlatform.mockResolvedValue({ agentsEnabled: true })
        mockCheck.mockReturnValue(null)
        mockCreate.mockResolvedValue({ id: 'agent-1', displayName: CREATE_INPUT.displayName })
        mockList.mockResolvedValue({ data: [] })
    })

    it('refuses when the instance has agents turned off, so chat cannot offer a surface nobody has', async () => {
        mockGetBoolean.mockReturnValue(false)

        const result = await runTool('ap_create_agent', CREATE_INPUT)

        expect(result).toEqual({ error: expect.stringContaining('not turned on') })
        expect(mockCreate).not.toHaveBeenCalled()
    })

    it('refuses when the plan does not include agents', async () => {
        mockGetOrCreateForPlatform.mockResolvedValue({ agentsEnabled: false })

        const result = await runTool('ap_create_agent', CREATE_INPUT)

        expect(result).toEqual({ error: expect.stringContaining('does not include Agents') })
        expect(mockCreate).not.toHaveBeenCalled()
    })

    it('refuses a member who may not write agents, rather than creating one for them', async () => {
        mockCheck.mockReturnValue({ content: [{ type: 'text', text: 'no permission' }] })

        const result = await runTool('ap_create_agent', CREATE_INPUT)

        expect(result).toEqual({ content: [{ type: 'text', text: 'no permission' }] })
        expect(mockCheck).toHaveBeenCalledWith(Permission.WRITE_AGENT, 'ap_create_agent')
        expect(mockCreate).not.toHaveBeenCalled()
    })

    it('asks for read permission to list, not write', async () => {
        await runTool('ap_list_agents')

        expect(mockCheck).toHaveBeenCalledWith(Permission.READ_AGENT, 'ap_list_agents')
    })

    it('creates the agent in the conversation project, as an unpublished draft with no tools', async () => {
        const result = await runTool('ap_create_agent', CREATE_INPUT)

        const request = mockCreate.mock.calls[0]?.[0]
        expect(request.projectId).toBe('proj-1')
        expect(request.ownerId).toBe('user-1')
        expect(request.request.draft.instructions).toBe(CREATE_INPUT.instructions)
        expect(request.request.draft.tools).toEqual([])
        expect(result).toEqual(expect.objectContaining({ agentId: 'agent-1', published: false }))
    })

    it('will not create one when the conversation belongs to no project the user can reach', async () => {
        mockGetConversationOrThrow.mockResolvedValue({ projectId: 'proj-elsewhere' })

        const result = await runTool('ap_create_agent', CREATE_INPUT)

        expect(result).toEqual({ error: expect.stringContaining('No project is selected') })
        expect(mockCreate).not.toHaveBeenCalled()
    })

    it('needs a name and instructions before it writes anything', async () => {
        const result = await runTool('ap_create_agent', { displayName: 'Inbox triage', instructions: '  ' })

        expect(result).toEqual({ error: expect.stringContaining('name and instructions') })
        expect(mockCreate).not.toHaveBeenCalled()
    })

    it('reports whether each listed agent is published, since a flow can only run a published one', async () => {
        mockList.mockResolvedValue({
            data: [
                { displayName: 'Published one', description: null, isPublished: true, toolCount: 2 },
                { displayName: 'Draft one', description: 'wip', isPublished: false, toolCount: 0 },
            ],
        })

        const result = await runTool('ap_list_agents')

        expect(result).toEqual([
            { displayName: 'Published one', description: null, published: true, toolCount: 2 },
            { displayName: 'Draft one', description: 'wip', published: false, toolCount: 0 },
        ])
    })
})
