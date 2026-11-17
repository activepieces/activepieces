import { beforeEach, describe, expect, it, vi } from 'vitest'

const { mockGetFile, mockGetData, mockFindConversation, mockGetUserProjects, mockMarkTurnAsHavingRead } = vi.hoisted(() => ({
    mockGetFile: vi.fn(),
    mockGetData: vi.fn(),
    mockFindConversation: vi.fn(),
    mockGetUserProjects: vi.fn(),
    mockMarkTurnAsHavingRead: vi.fn(),
}))

vi.mock('../../../../../src/app/file/file.service', () => ({
    fileService: () => ({ getFileOrThrow: mockGetFile, getDataOrThrow: mockGetData }),
}))

vi.mock('../../../../../src/app/ee/agent/agent-helpers', () => ({
    agentHelpers: {
        conversationRepo: () => ({ findOneBy: mockFindConversation }),
        getUserProjects: mockGetUserProjects,
    },
}))

vi.mock('../../../../../src/app/ee/agent/rpc/rpc-shared', async (importOriginal) => ({
    ...await importOriginal<Record<string, unknown>>(),
    markTurnAsHavingRead: mockMarkTurnAsHavingRead,
}))

const { conversationRpc } = await import('../../../../../src/app/ee/agent/rpc/conversation-rpc')

const log = { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() } as never

describe('readAgentFile', () => {
    beforeEach(() => {
        mockGetFile.mockReset().mockResolvedValue(fileRecord({}))
        mockGetData.mockReset().mockResolvedValue({ data: Buffer.from('png'), fileName: 'cat.png', metadata: { mimetype: 'image/png', conversationId: 'conv-1' } })
        mockFindConversation.mockReset().mockResolvedValue({ id: 'conv-1', userId: 'user-1' })
        mockGetUserProjects.mockReset().mockResolvedValue([{ id: 'project-1' }])
        mockMarkTurnAsHavingRead.mockReset().mockResolvedValue(undefined)
    })

    it('marks the turn as having read data when the worker reads a saved result for a run', async () => {
        await conversationRpc(log).readAgentFile({ platformId: 'platform-1', conversationId: 'conv-1', fileId: 'file-1', markReadForRunId: 'run-1' })

        expect(mockMarkTurnAsHavingRead).toHaveBeenCalledWith({ conversationId: 'conv-1', runId: 'run-1' })
    })

    it('does not mark the turn when no run is given', async () => {
        await read()

        expect(mockMarkTurnAsHavingRead).not.toHaveBeenCalled()
    })

    it('returns a file saved in this conversation, in a project the user can access', async () => {
        const file = await read()

        expect(mockGetUserProjects).toHaveBeenCalledWith(expect.objectContaining({ platformId: 'platform-1', userId: 'user-1' }))
        expect(file).toEqual({ data: Buffer.from('png'), mimeType: 'image/png', fileName: 'cat.png' })
    })

    it('refuses a file from another conversation', async () => {
        mockGetFile.mockResolvedValue(fileRecord({ conversationId: 'conv-2' }))

        await expect(read()).rejects.toThrow()
        expect(mockGetData).not.toHaveBeenCalled()
    })

    it('refuses a file with no conversation recorded', async () => {
        mockGetFile.mockResolvedValue(fileRecord({ conversationId: null }))

        await expect(read()).rejects.toThrow()
    })

    it('refuses a file in a project the user can no longer access', async () => {
        mockGetUserProjects.mockResolvedValue([{ id: 'project-2' }])

        await expect(read()).rejects.toThrow()
        expect(mockGetData).not.toHaveBeenCalled()
    })

    it('refuses a file on another platform', async () => {
        mockGetFile.mockResolvedValue(fileRecord({ platformId: 'platform-2' }))

        await expect(read()).rejects.toThrow()
    })
})

function read(): ReturnType<ReturnType<typeof conversationRpc>['readAgentFile']> {
    return conversationRpc(log).readAgentFile({ platformId: 'platform-1', conversationId: 'conv-1', fileId: 'file-1' })
}

function fileRecord({ conversationId = 'conv-1', platformId = 'platform-1' }: { conversationId?: string | null, platformId?: string }): Record<string, unknown> {
    return { id: 'file-1', platformId, projectId: 'project-1', metadata: { mimetype: 'image/png', conversationId } }
}
