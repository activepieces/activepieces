import { beforeEach, describe, expect, it, vi } from 'vitest'

const { mockGetData } = vi.hoisted(() => ({
    mockGetData: vi.fn(),
}))

vi.mock('../../../../../src/app/file/file.service', () => ({
    fileService: () => ({ getDataOrThrow: mockGetData }),
}))

const { conversationRpc } = await import('../../../../../src/app/ee/agent/rpc/conversation-rpc')

const log = { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() } as never

describe('readAgentFile', () => {
    beforeEach(() => {
        mockGetData.mockReset()
    })

    it('returns a file saved in this conversation, looked up on its platform', async () => {
        mockGetData.mockResolvedValue({ data: Buffer.from('png'), fileName: 'cat.png', metadata: { mimetype: 'image/png', conversationId: 'conv-1' } })

        const file = await read()

        expect(mockGetData).toHaveBeenCalledWith(expect.objectContaining({ platformId: 'platform-1', fileId: 'file-1' }))
        expect(file).toEqual({ data: Buffer.from('png'), mimeType: 'image/png', fileName: 'cat.png' })
    })

    it('refuses a file from another conversation', async () => {
        mockGetData.mockResolvedValue({ data: Buffer.from('png'), metadata: { mimetype: 'image/png', conversationId: 'conv-2' } })

        await expect(read()).rejects.toThrow()
    })

    it('refuses a file with no conversation recorded', async () => {
        mockGetData.mockResolvedValue({ data: Buffer.from('png'), metadata: { mimetype: 'image/png' } })

        await expect(read()).rejects.toThrow()
    })

    it('refuses a file that is not on the platform', async () => {
        mockGetData.mockRejectedValue(new Error('File not found'))

        await expect(read()).rejects.toThrow()
    })
})

function read(): ReturnType<ReturnType<typeof conversationRpc>['readAgentFile']> {
    return conversationRpc(log).readAgentFile({ platformId: 'platform-1', conversationId: 'conv-1', fileId: 'file-1' })
}
