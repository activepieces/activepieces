import { Permission } from '@activepieces/core-utils'
import { AgentToolType } from '@activepieces/shared'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const {
    mockGetUserProjects,
    mockGetConversationOrThrow,
    mockGetBoolean,
    mockGetOrCreateForPlatform,
    mockCheck,
    mockCreate,
    mockList,
    mockUpdate,
    mockGetOneOrThrow,
    mockPublish,
    mockPieceGet,
    mockConnectionGet,
} = vi.hoisted(() => ({
    mockGetUserProjects: vi.fn(),
    mockGetConversationOrThrow: vi.fn(),
    mockGetBoolean: vi.fn(),
    mockGetOrCreateForPlatform: vi.fn(),
    mockCheck: vi.fn(),
    mockCreate: vi.fn(),
    mockList: vi.fn(),
    mockUpdate: vi.fn(),
    mockGetOneOrThrow: vi.fn(),
    mockPublish: vi.fn(),
    mockPieceGet: vi.fn(),
    mockConnectionGet: vi.fn(),
}))

vi.mock('../../../../../src/app/ee/agent/agent-helpers', async (importOriginal) => {
    const actual = await importOriginal<typeof import('../../../../../src/app/ee/agent/agent-helpers')>()
    return {
        ...actual,
        agentHelpers: {
            ...actual.agentHelpers,
            getUserProjects: mockGetUserProjects,
            getConversationOrThrow: mockGetConversationOrThrow,
        },
    }
})

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

vi.mock('../../../../../src/app/pieces/metadata/piece-metadata-service', () => ({
    pieceMetadataService: () => ({ get: mockPieceGet }),
}))

vi.mock('../../../../../src/app/app-connection/app-connection-service/app-connection-service', () => ({
    appConnectionService: () => ({ getOneWithoutValue: mockConnectionGet }),
}))

vi.mock('../../../../../src/app/ee/agent/agent-service', () => ({
    agentService: () => ({ create: mockCreate, list: mockList, update: mockUpdate, getOneOrThrow: mockGetOneOrThrow, publish: mockPublish }),
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
        mockGetOneOrThrow.mockResolvedValue({ id: 'agent-1', draft: { instructions: 'Old brief.', tools: [], maxSteps: 20 }, published: null })
        mockUpdate.mockResolvedValue({ id: 'agent-1', displayName: 'Inbox triage', published: null })
        mockPublish.mockResolvedValue({ id: 'agent-1', displayName: 'Inbox triage', published: { instructions: 'Sort the inbox.' } })
        mockPieceGet.mockResolvedValue({ version: '0.9.1', actions: { gmail_search_mail: { name: 'gmail_search_mail' } } })
        mockConnectionGet.mockResolvedValue({ pieceName: '@activepieces/piece-gmail' })
    })

    it('refuses when the instance has agents turned off, so chat cannot offer a surface nobody has', async () => {
        mockGetBoolean.mockReturnValue(false)

        const result = await runTool('ap_create_agent', CREATE_INPUT)

        expect(result).toEqual({ error: expect.stringContaining('not available here') })
        expect(mockCreate).not.toHaveBeenCalled()
    })

    it('refuses when the plan does not include agents', async () => {
        mockGetOrCreateForPlatform.mockResolvedValue({ agentsEnabled: false })

        const result = await runTool('ap_create_agent', CREATE_INPUT)

        expect(result).toEqual({ error: expect.stringContaining('not available here') })
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

    it('needs write permission to change one', async () => {
        mockCheck.mockReturnValue({ content: [{ type: 'text', text: 'no permission' }] })

        const result = await runTool('ap_update_agent', { agentId: 'agent-1', instructions: 'New brief.' })

        expect(mockCheck).toHaveBeenCalledWith(Permission.WRITE_AGENT, 'ap_update_agent')
        expect(result).toEqual({ content: [{ type: 'text', text: 'no permission' }] })
        expect(mockUpdate).not.toHaveBeenCalled()
    })

    it('replaces the instructions while keeping the rest of the draft', async () => {
        await runTool('ap_update_agent', { agentId: 'agent-1', instructions: 'New brief.' })

        const request = mockUpdate.mock.calls[0]?.[0]?.request
        expect(request.draft).toEqual({ instructions: 'New brief.', tools: [], maxSteps: 20 })
        expect(request.displayName).toBeUndefined()
    })

    it('says a published agent keeps running its published version until someone publishes the change', async () => {
        mockGetOneOrThrow.mockResolvedValue({ id: 'agent-1', draft: { instructions: 'Old brief.', tools: [] }, published: { instructions: 'Old brief.' } })
        mockUpdate.mockResolvedValue({ id: 'agent-1', displayName: 'Inbox triage', published: { instructions: 'Old brief.' } })

        const result = await runTool('ap_update_agent', { agentId: 'agent-1', instructions: 'New brief.' })

        expect(result).toEqual(expect.objectContaining({ note: expect.stringContaining('do not tell the user the change is live') }))
    })

    it('refuses an agent the user cannot see, rather than reporting a change it did not make', async () => {
        mockGetOneOrThrow.mockRejectedValue(new Error('ENTITY_NOT_FOUND'))

        const result = await runTool('ap_update_agent', { agentId: 'agent-elsewhere', instructions: 'New brief.' })

        expect(result).toEqual({ error: expect.stringContaining('No agent with that id') })
        expect(mockUpdate).not.toHaveBeenCalled()
    })

    it('treats a blank field as nothing to change, rather than blanking it', async () => {
        const result = await runTool('ap_update_agent', { agentId: 'agent-1', displayName: '   ', instructions: '' })

        expect(result).toEqual({ error: expect.stringContaining('Nothing to change') })
        expect(mockUpdate).not.toHaveBeenCalled()
    })

    it('will not call the service with nothing to change', async () => {
        const result = await runTool('ap_update_agent', { agentId: 'agent-1' })

        expect(result).toEqual({ error: expect.stringContaining('Nothing to change') })
        expect(mockUpdate).not.toHaveBeenCalled()
    })

    it('needs write permission to publish, and says what went live', async () => {
        mockCheck.mockReturnValueOnce({ content: [{ type: 'text', text: 'no permission' }] })

        const denied = await runTool('ap_publish_agent', { agentId: 'agent-1' })

        expect(mockCheck).toHaveBeenCalledWith(Permission.WRITE_AGENT, 'ap_publish_agent')
        expect(denied).toEqual({ content: [{ type: 'text', text: 'no permission' }] })
        expect(mockPublish).not.toHaveBeenCalled()

        const allowed = await runTool('ap_publish_agent', { agentId: 'agent-1' })

        expect(mockPublish).toHaveBeenCalledWith({ id: 'agent-1', projectId: 'proj-1', userId: 'user-1' })
        expect(allowed).toEqual(expect.objectContaining({ published: true, note: expect.stringContaining('is live') }))
    })

    it('reports a refused publish instead of telling the user it went live', async () => {
        mockPublish.mockRejectedValue(new Error('An agent needs instructions before it can be published'))

        const result = await runTool('ap_publish_agent', { agentId: 'agent-1' })

        expect(result).toEqual({ error: expect.stringContaining('Could not publish') })
    })

    it('will not publish without knowing which agent', async () => {
        const result = await runTool('ap_publish_agent', { agentId: '  ' })

        expect(result).toEqual({ error: expect.stringContaining('Which agent') })
        expect(mockPublish).not.toHaveBeenCalled()
    })

    it('publishes after the edit when asked to make a change live, never alongside it', async () => {
        const result = await runTool('ap_update_agent', { agentId: 'agent-1', instructions: 'New brief.', publish: true })

        expect(mockUpdate).toHaveBeenCalled()
        expect(mockPublish).toHaveBeenCalledWith({ id: 'agent-1', projectId: 'proj-1', userId: 'user-1' })
        expect(mockUpdate.mock.invocationCallOrder[0]).toBeLessThan(mockPublish.mock.invocationCallOrder[0])
        expect(result).toEqual(expect.objectContaining({ published: true }))
    })

    it('does not claim a change is live when the publish after it failed', async () => {
        mockPublish.mockRejectedValue(new Error('needs instructions'))

        const result = await runTool('ap_update_agent', { agentId: 'agent-1', instructions: 'New brief.', publish: true })

        expect(result).toEqual(expect.objectContaining({ published: false, note: expect.stringContaining('nothing is live yet') }))
    })

    it('gives an agent a piece action, pinned to the version it resolved', async () => {
        const result = await runTool('ap_add_agent_tool', {
            agentId: 'agent-1',
            pieceName: '@activepieces/piece-gmail',
            actionName: 'gmail_search_mail',
            connectionExternalId: 'conn-1',
        })

        const draft = mockUpdate.mock.calls[0]?.[0]?.request?.draft
        expect(draft.tools).toEqual([{
            type: AgentToolType.PIECE,
            toolName: 'gmail_search_mail',
            pieceMetadata: {
                pieceName: '@activepieces/piece-gmail',
                pieceVersion: '0.9.1',
                actionName: 'gmail_search_mail',
                predefinedInput: { auth: 'conn-1', fields: {} },
            },
        }])
        expect(result).toEqual(expect.objectContaining({ changed: ['tool gmail_search_mail'] }))
    })

    it('refuses an action the piece does not have, rather than storing a tool that cannot run', async () => {
        mockPieceGet.mockResolvedValue({ version: '0.9.1', actions: {} })

        const result = await runTool('ap_add_agent_tool', { agentId: 'agent-1', pieceName: '@activepieces/piece-gmail', actionName: 'invented_action' })

        expect(result).toEqual({ error: expect.stringContaining('no action called') })
        expect(mockUpdate).not.toHaveBeenCalled()
    })

    it('refuses a connection for a different app', async () => {
        mockConnectionGet.mockResolvedValue({ pieceName: '@activepieces/piece-slack' })

        const result = await runTool('ap_add_agent_tool', {
            agentId: 'agent-1',
            pieceName: '@activepieces/piece-gmail',
            actionName: 'gmail_search_mail',
            connectionExternalId: 'conn-slack',
        })

        expect(result).toEqual({ error: expect.stringContaining('not @activepieces/piece-gmail') })
        expect(mockUpdate).not.toHaveBeenCalled()
    })

    it('refuses a connection that is not in the project', async () => {
        mockConnectionGet.mockResolvedValue(null)

        const result = await runTool('ap_add_agent_tool', {
            agentId: 'agent-1',
            pieceName: '@activepieces/piece-gmail',
            actionName: 'gmail_search_mail',
            connectionExternalId: 'conn-elsewhere',
        })

        expect(result).toEqual({ error: expect.stringContaining('No connection with that externalId') })
        expect(mockUpdate).not.toHaveBeenCalled()
    })

    it('will not add the same action twice', async () => {
        mockGetOneOrThrow.mockResolvedValue({
            id: 'agent-1',
            displayName: 'Inbox triage',
            draft: { instructions: 'Sort.', tools: [{ type: AgentToolType.PIECE, toolName: 'gmail_search_mail', pieceMetadata: {} }] },
            published: null,
        })

        const result = await runTool('ap_add_agent_tool', { agentId: 'agent-1', pieceName: '@activepieces/piece-gmail', actionName: 'gmail_search_mail' })

        expect(result).toEqual({ error: expect.stringContaining('already has gmail_search_mail') })
        expect(mockUpdate).not.toHaveBeenCalled()
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
