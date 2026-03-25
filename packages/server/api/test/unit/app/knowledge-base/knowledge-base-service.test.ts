import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockFindOneBy = vi.fn()
const mockDelete = vi.fn()
const mockCount = vi.fn()
const mockSave = vi.fn()
const mockFind = vi.fn()
const mockInsert = vi.fn()

vi.mock('../../../../src/app/core/db/repo-factory', () => ({
    repoFactory: vi.fn(() => () => ({
        findOneBy: mockFindOneBy,
        delete: mockDelete,
        count: mockCount,
        save: mockSave,
        find: mockFind,
        insert: mockInsert,
    })),
}))

const mockDbQuery = vi.fn().mockResolvedValue([])

vi.mock('../../../../src/app/database/database-connection', () => ({
    databaseConnection: vi.fn(() => ({
        query: mockDbQuery,
    })),
}))

const mockFileServiceDelete = vi.fn().mockResolvedValue(undefined)
const mockFileServiceGetDataOrThrow = vi.fn()

vi.mock('../../../../src/app/file/file.service', () => ({
    fileService: vi.fn(() => ({
        delete: mockFileServiceDelete,
        getDataOrThrow: mockFileServiceGetDataOrThrow,
    })),
}))

import { knowledgeBaseService } from '../../../../src/app/knowledge-base/knowledge-base.service'

const mockLog = {
    info: vi.fn(),
    debug: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    child: vi.fn(),
    fatal: vi.fn(),
    trace: vi.fn(),
    silent: vi.fn(),
    level: 'info',
} as any

describe('knowledgeBaseService', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        mockDbQuery.mockResolvedValue([])
    })

    describe('deleteFile', () => {
        it('should delete the KB file and the underlying file', async () => {
            const kbFile = { id: 'kb-1', projectId: 'proj-1', fileId: 'file-1', displayName: 'test.txt' }
            mockFindOneBy.mockResolvedValue(kbFile)
            mockDelete.mockResolvedValue({ affected: 1 })

            await knowledgeBaseService(mockLog).deleteFile({ projectId: 'proj-1', id: 'kb-1' })

            expect(mockFindOneBy).toHaveBeenCalledWith({ id: 'kb-1', projectId: 'proj-1' })
            expect(mockDelete).toHaveBeenCalledWith({ id: 'kb-1', projectId: 'proj-1' })
            expect(mockFileServiceDelete).toHaveBeenCalledWith({ projectId: 'proj-1', fileId: 'file-1' })
        })

        it('should not call delete when KB file does not exist', async () => {
            mockFindOneBy.mockResolvedValue(null)

            await knowledgeBaseService(mockLog).deleteFile({ projectId: 'proj-1', id: 'kb-missing' })

            expect(mockDelete).not.toHaveBeenCalled()
            expect(mockFileServiceDelete).not.toHaveBeenCalled()
        })
    })

    describe('getChunkCount', () => {
        it('should scope query by projectId and knowledgeBaseFileId', async () => {
            mockCount.mockResolvedValue(42)

            const result = await knowledgeBaseService(mockLog).getChunkCount({
                projectId: 'proj-1',
                knowledgeBaseFileId: 'kb-file-1',
            })

            expect(result).toBe(42)
            expect(mockCount).toHaveBeenCalledWith({
                where: { projectId: 'proj-1', knowledgeBaseFileId: 'kb-file-1' },
            })
        })
    })

    describe('search', () => {
        it('should clamp negative scores to zero', async () => {
            mockDbQuery.mockResolvedValue([
                { id: '1', content: 'close match', metadata: {}, chunkIndex: 0, distance: 0.3 },
                { id: '2', content: 'far match', metadata: {}, chunkIndex: 1, distance: 1.5 },
            ])

            const results = await knowledgeBaseService(mockLog).search({
                projectId: 'proj-1',
                knowledgeBaseFileIds: ['kb-file-1'],
                queryEmbedding: [0.1, 0.2, 0.3],
                limit: 5,
            })

            expect(results[0].score).toBe(0.7)
            expect(results[1].score).toBe(0)
        })

        it('should return exact score for normal distances', async () => {
            mockDbQuery.mockResolvedValue([
                { id: '1', content: 'match', metadata: {}, chunkIndex: 0, distance: 0 },
            ])

            const results = await knowledgeBaseService(mockLog).search({
                projectId: 'proj-1',
                knowledgeBaseFileIds: ['kb-file-1'],
                queryEmbedding: [0.1, 0.2],
                limit: 5,
            })

            expect(results[0].score).toBe(1)
        })
    })

    describe('storeEmbeddings', () => {
        it('should delete existing chunks with projectId scope before inserting', async () => {
            mockDelete.mockResolvedValue({ affected: 0 })

            await knowledgeBaseService(mockLog).storeEmbeddings({
                projectId: 'proj-1',
                knowledgeBaseFileId: 'kb-file-1',
                chunks: [{
                    content: 'test',
                    embedding: [0.1, 0.2],
                    chunkIndex: 0,
                }],
            })

            expect(mockDelete).toHaveBeenCalledWith({
                knowledgeBaseFileId: 'kb-file-1',
                projectId: 'proj-1',
            })
        })
    })
})
