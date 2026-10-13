import { describe, expect, it, vi } from 'vitest'

const { mockGetUserProjects, mockListFlows } = vi.hoisted(() => ({
    mockGetUserProjects: vi.fn(),
    mockListFlows: vi.fn().mockResolvedValue({ data: [] }),
}))

vi.mock('../../../../../src/app/ee/agent/agent-helpers', () => ({
    agentHelpers: { getUserProjects: mockGetUserProjects },
}))

vi.mock('../../../../../src/app/flows/flow/flow.service', () => ({
    flowService: () => ({ list: mockListFlows }),
}))

const noopLogger = { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }

const ownerProjects = [
    { id: 'proj-own', displayName: 'Own', type: 'TEAM' },
    { id: 'proj-other', displayName: 'Another tenant', type: 'TEAM' },
]

async function listAcrossProjects(confinedToProjectId?: string | null) {
    const { executeCrossProjectTool } = await import('../../../../../src/app/ee/agent/tools/agent-tools')
    mockGetUserProjects.mockResolvedValue(ownerProjects)
    return executeCrossProjectTool({
        toolName: 'ap_list_across_projects',
        toolInput: { resource: 'flows' },
        platformId: 'plat-1',
        userId: 'owner-1',
        conversationId: 'conv-1',
        ...(confinedToProjectId === undefined ? {} : { confinedToProjectId }),
        log: noopLogger as never,
    } as never)
}

describe('executeCrossProjectTool — project confinement', () => {
    it('only reaches the confined project, even though the owner can see others', async () => {
        mockListFlows.mockClear()

        await listAcrossProjects('proj-own')

        const projectIdsQueried = mockListFlows.mock.calls[0]?.[0]?.projectIds
        expect(projectIdsQueried).toEqual(['proj-own'])
    })

    it('reaches every project the user can see when unconfined, which chat relies on', async () => {
        mockListFlows.mockClear()

        await listAcrossProjects(null)

        const projectIdsQueried = mockListFlows.mock.calls[0]?.[0]?.projectIds
        expect(projectIdsQueried).toEqual(['proj-own', 'proj-other'])
    })
})
