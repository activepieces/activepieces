import { IsNull } from 'typeorm'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockFindOneBy = vi.fn()
const mockDelete = vi.fn()
const mockCount = vi.fn()
const mockSave = vi.fn()
const mockFind = vi.fn()
const mockInsert = vi.fn()
const mockUpdate = vi.fn()
const mockCountPending = vi.fn()

vi.mock('../../../../src/app/core/db/repo-factory', () => ({
    repoFactory: vi.fn(() => () => ({
        findOneBy: mockFindOneBy,
        delete: mockDelete,
        count: mockCount,
        save: mockSave,
        find: mockFind,
        insert: mockInsert,
        update: mockUpdate,
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

        it('should filter results below similarity threshold', async () => {
            mockDbQuery.mockResolvedValue([
                { id: '1', content: 'good match', metadata: {}, chunkIndex: 0, distance: 0.2 },
                { id: '2', content: 'bad match', metadata: {}, chunkIndex: 1, distance: 0.8 },
            ])

            const results = await knowledgeBaseService(mockLog).search({
                projectId: 'proj-1',
                knowledgeBaseFileIds: ['kb-file-1'],
                queryEmbedding: [0.1, 0.2],
                limit: 5,
                similarityThreshold: 0.5,
            })

            expect(results).toHaveLength(1)
            expect(results[0].score).toBe(0.8)
        })

        it('should return all results when no threshold is provided', async () => {
            mockDbQuery.mockResolvedValue([
                { id: '1', content: 'good', metadata: {}, chunkIndex: 0, distance: 0.2 },
                { id: '2', content: 'bad', metadata: {}, chunkIndex: 1, distance: 0.9 },
            ])

            const results = await knowledgeBaseService(mockLog).search({
                projectId: 'proj-1',
                knowledgeBaseFileIds: ['kb-file-1'],
                queryEmbedding: [0.1, 0.2],
                limit: 5,
            })

            expect(results).toHaveLength(2)
        })

        it('should include results when threshold is 0', async () => {
            mockDbQuery.mockResolvedValue([
                { id: '1', content: 'match', metadata: {}, chunkIndex: 0, distance: 0.5 },
            ])

            const results = await knowledgeBaseService(mockLog).search({
                projectId: 'proj-1',
                knowledgeBaseFileIds: ['kb-file-1'],
                queryEmbedding: [0.1, 0.2],
                limit: 5,
                similarityThreshold: 0,
            })

            expect(results).toHaveLength(1)
        })
    })

    describe('storeChunks', () => {
        it('should insert new chunks when no id is provided', async () => {
            await knowledgeBaseService(mockLog).storeChunks({
                projectId: 'proj-1',
                knowledgeBaseFileId: 'kb-file-1',
                chunks: [{
                    content: 'test content',
                    chunkIndex: 0,
                }],
            })

            expect(mockInsert).toHaveBeenCalledTimes(1)
            expect(mockUpdate).not.toHaveBeenCalled()
        })

        it('should update existing chunks when id is provided', async () => {
            await knowledgeBaseService(mockLog).storeChunks({
                projectId: 'proj-1',
                knowledgeBaseFileId: 'kb-file-1',
                chunks: [{
                    id: 'chunk-1',
                    embedding: [0.1, 0.2, 0.3],
                }],
            })

            expect(mockInsert).not.toHaveBeenCalled()
            expect(mockUpdate).toHaveBeenCalledTimes(1)
            expect(mockUpdate).toHaveBeenCalledWith(
                { id: 'chunk-1', projectId: 'proj-1' },
                expect.objectContaining({ embedding: '[0.1,0.2,0.3]' }),
            )
        })

        it('should handle mixed insert and update chunks', async () => {
            await knowledgeBaseService(mockLog).storeChunks({
                projectId: 'proj-1',
                knowledgeBaseFileId: 'kb-file-1',
                chunks: [
                    { content: 'new chunk', chunkIndex: 0 },
                    { id: 'existing-1', embedding: [0.5] },
                ],
            })

            expect(mockInsert).toHaveBeenCalledTimes(1)
            expect(mockUpdate).toHaveBeenCalledTimes(1)
        })

        it('should not call insert or update for empty chunks array', async () => {
            await knowledgeBaseService(mockLog).storeChunks({
                projectId: 'proj-1',
                knowledgeBaseFileId: 'kb-file-1',
                chunks: [],
            })

            expect(mockInsert).not.toHaveBeenCalled()
            expect(mockUpdate).not.toHaveBeenCalled()
        })
    })

    describe('embedPendingChunks', () => {
        it('embeds every chunk stored without a vector and writes it back by id', async () => {
            mockFind.mockResolvedValue([
                { id: 'chunk-1', content: 'first', chunkIndex: 0 },
                { id: 'chunk-2', content: 'second', chunkIndex: 1 },
            ])
            const embedFn = vi.fn().mockResolvedValue([[0.1], [0.2]])

            const embedded = await knowledgeBaseService(mockLog).embedPendingChunks({
                projectId: 'proj-1',
                knowledgeBaseFileId: 'kb-file-1',
                embedFn,
            })

            expect(embedded).toEqual({ embeddedCount: 2, remainingCount: 0 })
            expect(embedFn).toHaveBeenCalledWith(['first', 'second'], expect.objectContaining({ abortSignal: expect.any(AbortSignal) }))
            expect(mockInsert).not.toHaveBeenCalled()
            expect(mockUpdate).not.toHaveBeenCalled()
            expect(mockDbQuery).toHaveBeenCalledTimes(1)
            const [sql, sqlParams] = mockDbQuery.mock.calls[0]
            expect(sql).toContain('UPDATE knowledge_base_chunk')
            expect(sql).toContain('"projectId" = $3')
            expect(sqlParams).toEqual([['chunk-1', 'chunk-2'], ['[0.1]', '[0.2]'], 'proj-1'])
        })

        it('asks only for chunks that have no embedding yet', async () => {
            mockFind.mockResolvedValue([])

            await knowledgeBaseService(mockLog).embedPendingChunks({
                projectId: 'proj-1',
                knowledgeBaseFileId: 'kb-file-1',
                embedFn: vi.fn(),
            })

            expect(mockFind).toHaveBeenCalledWith(expect.objectContaining({
                where: expect.objectContaining({
                    projectId: 'proj-1',
                    knowledgeBaseFileId: 'kb-file-1',
                    embedding: IsNull(),
                }),
            }))
        })

        it('is a no-op when every chunk is already embedded', async () => {
            mockFind.mockResolvedValue([])
            const embedFn = vi.fn()

            const embedded = await knowledgeBaseService(mockLog).embedPendingChunks({
                projectId: 'proj-1',
                knowledgeBaseFileId: 'kb-file-1',
                embedFn,
            })

            expect(embedded).toEqual({ embeddedCount: 0, remainingCount: 0 })
            expect(embedFn).not.toHaveBeenCalled()
            expect(mockUpdate).not.toHaveBeenCalled()
        })

        it('refuses to write vectors it cannot line up with their chunks', async () => {
            mockFind.mockResolvedValue([
                { id: 'chunk-1', content: 'first', chunkIndex: 0 },
                { id: 'chunk-2', content: 'second', chunkIndex: 1 },
            ])

            await expect(knowledgeBaseService(mockLog).embedPendingChunks({
                projectId: 'proj-1',
                knowledgeBaseFileId: 'kb-file-1',
                embedFn: vi.fn().mockResolvedValue([[0.1]]),
            })).rejects.toThrow(/Embedding count mismatch/)

            expect(mockUpdate).not.toHaveBeenCalled()
        })

        it('skips blank chunks, which no embedding provider accepts, instead of failing the whole file', async () => {
            mockFind.mockResolvedValue([
                { id: 'chunk-1', content: '   ', chunkIndex: 0 },
                { id: 'chunk-2', content: 'real content', chunkIndex: 1 },
            ])
            const embedFn = vi.fn().mockResolvedValue([[0.3]])

            const embedded = await knowledgeBaseService(mockLog).embedPendingChunks({
                projectId: 'proj-1',
                knowledgeBaseFileId: 'kb-file-1',
                embedFn,
            })

            expect(embedded).toEqual({ embeddedCount: 1, remainingCount: 0 })
            expect(embedFn).toHaveBeenCalledWith(['real content'], expect.objectContaining({ abortSignal: expect.any(AbortSignal) }))
        })

        it('aborts a batch that outruns the budget and keeps what it already wrote', async () => {
            mockFind.mockResolvedValue([
                { id: 'chunk-1', content: 'first', chunkIndex: 0 },
                { id: 'chunk-2', content: 'second', chunkIndex: 1 },
            ])
            const embedFn = vi.fn().mockImplementation((_texts: string[], { abortSignal }: { abortSignal: AbortSignal }) => {
                expect(abortSignal).toBeInstanceOf(AbortSignal)
                return Promise.reject(Object.assign(new Error('The operation was aborted'), { name: 'TimeoutError' }))
            })

            await expect(knowledgeBaseService(mockLog).embedPendingChunks({
                projectId: 'proj-1',
                knowledgeBaseFileId: 'kb-file-1',
                embedFn,
            })).rejects.toThrow(/aborted/)
        })

        it('stops at its time budget and leaves the rest for the next search, so one call cannot outlive the 60s worker RPC', async () => {
            const pending = Array.from({ length: 300 }, (_, index) => ({ id: `chunk-${index}`, content: `c${index}`, chunkIndex: index }))
            mockFind.mockResolvedValue(pending)
            const embedFn = vi.fn().mockImplementation(async (texts: string[]) => {
                vi.advanceTimersByTime(11_000)
                return texts.map(() => [0.5])
            })

            vi.useFakeTimers()
            try {
                const embedded = await knowledgeBaseService(mockLog).embedPendingChunks({
                    projectId: 'proj-1',
                    knowledgeBaseFileId: 'kb-file-1',
                    embedFn,
                })

                expect(embedded).toEqual({ embeddedCount: 100, remainingCount: 200 })
                expect(embedFn).toHaveBeenCalledTimes(2)
            }
            finally {
                vi.useRealTimers()
            }
        })

        it('embeds in batches so a large file never goes out as one request', async () => {
            const pending = Array.from({ length: 120 }, (_, index) => ({ id: `chunk-${index}`, content: `c${index}`, chunkIndex: index }))
            mockFind.mockResolvedValue(pending)
            const embedFn = vi.fn().mockImplementation((texts: string[]) => Promise.resolve(texts.map(() => [0.5])))

            const embedded = await knowledgeBaseService(mockLog).embedPendingChunks({
                projectId: 'proj-1',
                knowledgeBaseFileId: 'kb-file-1',
                embedFn,
            })

            expect(embedded).toEqual({ embeddedCount: 120, remainingCount: 0 })
            expect(embedFn).toHaveBeenCalledTimes(3)
            expect(embedFn.mock.calls.map(([texts]) => texts.length)).toEqual([50, 50, 20])
        })
    })
})
