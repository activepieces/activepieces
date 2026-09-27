import { beforeEach, describe, expect, it, vi } from 'vitest'

const { mockFindConversation, mockGetData } = vi.hoisted(() => ({
    mockFindConversation: vi.fn(),
    mockGetData: vi.fn(),
}))

vi.mock('../../../../../src/app/ee/agent/agent-helpers', () => ({
    agentHelpers: { conversationRepo: () => ({ findOneBy: mockFindConversation }) },
}))

vi.mock('../../../../../src/app/file/file.service', () => ({
    fileService: () => ({ getDataOrThrow: mockGetData }),
}))

const { conversationRpc } = await import('../../../../../src/app/ee/agent/rpc/conversation-rpc')

const log = { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() } as never

describe('readAgentFile', () => {
    beforeEach(() => {
        mockFindConversation.mockReset().mockResolvedValue({ id: 'conv-1', projectId: 'project-1' })
        mockGetData.mockReset()
    })

    it('returns a file saved in this conversation', async () => {
        mockGetData.mockResolvedValue({ data: Buffer.from('png'), fileName: 'cat.png', metadata: { mimetype: 'image/png', conversationId: 'conv-1' } })

        const file = await read()

        expect(mockGetData).toHaveBeenCalledWith(expect.objectContaining({ projectId: 'project-1', fileId: 'file-1' }))
        expect(file).toEqual({ data: Buffer.from('png'), mimeType: 'image/png', fileName: 'cat.png' })
    })

    it('refuses a file from another conversation in the same project', async () => {
        mockGetData.mockResolvedValue({ data: Buffer.from('png'), metadata: { mimetype: 'image/png', conversationId: 'conv-2' } })

        await expect(read()).rejects.toThrow()
    })

    it('refuses a file with no conversation recorded', async () => {
        mockGetData.mockResolvedValue({ data: Buffer.from('png'), metadata: { mimetype: 'image/png' } })

        await expect(read()).rejects.toThrow()
    })

    it('refuses when the conversation does not exist on this platform', async () => {
        mockFindConversation.mockResolvedValue(null)

        await expect(read()).rejects.toThrow()
        expect(mockGetData).not.toHaveBeenCalled()
    })
})

function read(): ReturnType<ReturnType<typeof conversationRpc>['readAgentFile']> {
    return conversationRpc(log).readAgentFile({ platformId: 'platform-1', conversationId: 'conv-1', fileId: 'file-1' })
}
