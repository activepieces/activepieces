import { describe, it, expect } from 'vitest'
import { z } from 'zod'

const EMBEDDING_DIMENSION = 768

const StoreChunksSchema = z.object({
    chunks: z.array(z.object({
        id: z.string().optional(),
        content: z.string().optional(),
        embedding: z.array(z.number()).length(EMBEDDING_DIMENSION).optional(),
        chunkIndex: z.number().optional(),
        metadata: z.record(z.string(), z.unknown()).optional(),
    })),
})

const SearchSchema = z.object({
    knowledgeBaseFileIds: z.array(z.string()),
    queryEmbedding: z.array(z.number()).length(EMBEDDING_DIMENSION),
    limit: z.number().int().min(1).max(100).optional().default(5),
    similarityThreshold: z.number().min(0).max(1).optional(),
})

describe('embedding dimension validation', () => {
    describe('store-chunks', () => {
        it('should accept a 768-dim embedding', () => {
            const result = StoreChunksSchema.safeParse({
                chunks: [{
                    content: 'hello',
                    embedding: Array(768).fill(0.1),
                    chunkIndex: 0,
                }],
            })
            expect(result.success).toBe(true)
        })

        it('should accept a chunk without embedding', () => {
            const result = StoreChunksSchema.safeParse({
                chunks: [{
                    content: 'hello',
                    chunkIndex: 0,
                }],
            })
            expect(result.success).toBe(true)
        })

        it('should accept an update chunk with id and embedding', () => {
            const result = StoreChunksSchema.safeParse({
                chunks: [{
                    id: 'chunk-1',
                    embedding: Array(768).fill(0.1),
                }],
            })
            expect(result.success).toBe(true)
        })

        it('should reject a 1536-dim embedding', () => {
            const result = StoreChunksSchema.safeParse({
                chunks: [{
                    content: 'hello',
                    embedding: Array(1536).fill(0.1),
                    chunkIndex: 0,
                }],
            })
            expect(result.success).toBe(false)
        })

        it('should reject an empty embedding', () => {
            const result = StoreChunksSchema.safeParse({
                chunks: [{
                    content: 'hello',
                    embedding: [],
                    chunkIndex: 0,
                }],
            })
            expect(result.success).toBe(false)
        })
    })

    describe('search', () => {
        it('should accept a 768-dim query embedding', () => {
            const result = SearchSchema.safeParse({
                knowledgeBaseFileIds: ['file-1'],
                queryEmbedding: Array(768).fill(0.1),
            })
            expect(result.success).toBe(true)
        })

        it('should reject a mismatched query embedding', () => {
            const result = SearchSchema.safeParse({
                knowledgeBaseFileIds: ['file-1'],
                queryEmbedding: Array(512).fill(0.1),
            })
            expect(result.success).toBe(false)
        })

        it('should accept a similarity threshold between 0 and 1', () => {
            const result = SearchSchema.safeParse({
                knowledgeBaseFileIds: ['file-1'],
                queryEmbedding: Array(768).fill(0.1),
                similarityThreshold: 0.5,
            })
            expect(result.success).toBe(true)
        })

        it('should accept threshold of 0', () => {
            const result = SearchSchema.safeParse({
                knowledgeBaseFileIds: ['file-1'],
                queryEmbedding: Array(768).fill(0.1),
                similarityThreshold: 0,
            })
            expect(result.success).toBe(true)
        })

        it('should reject a threshold greater than 1', () => {
            const result = SearchSchema.safeParse({
                knowledgeBaseFileIds: ['file-1'],
                queryEmbedding: Array(768).fill(0.1),
                similarityThreshold: 1.5,
            })
            expect(result.success).toBe(false)
        })

        it('should accept search without threshold', () => {
            const result = SearchSchema.safeParse({
                knowledgeBaseFileIds: ['file-1'],
                queryEmbedding: Array(768).fill(0.1),
            })
            expect(result.success).toBe(true)
        })
    })
})
