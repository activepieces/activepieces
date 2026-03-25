import { describe, it, expect } from 'vitest'
import { z } from 'zod'

const EMBEDDING_DIMENSION = 768

const StoreEmbeddingsSchema = z.object({
    chunks: z.array(z.object({
        content: z.string(),
        embedding: z.array(z.number()).length(EMBEDDING_DIMENSION),
        chunkIndex: z.number(),
        metadata: z.record(z.string(), z.unknown()).optional(),
    })),
})

const SearchSchema = z.object({
    knowledgeBaseFileIds: z.array(z.string()),
    queryEmbedding: z.array(z.number()).length(EMBEDDING_DIMENSION),
    limit: z.number().int().min(1).max(100).optional().default(5),
})

describe('embedding dimension validation', () => {
    describe('store-embeddings', () => {
        it('should accept a 768-dim embedding', () => {
            const result = StoreEmbeddingsSchema.safeParse({
                chunks: [{
                    content: 'hello',
                    embedding: Array(768).fill(0.1),
                    chunkIndex: 0,
                }],
            })
            expect(result.success).toBe(true)
        })

        it('should reject a 1536-dim embedding', () => {
            const result = StoreEmbeddingsSchema.safeParse({
                chunks: [{
                    content: 'hello',
                    embedding: Array(1536).fill(0.1),
                    chunkIndex: 0,
                }],
            })
            expect(result.success).toBe(false)
        })

        it('should reject an empty embedding', () => {
            const result = StoreEmbeddingsSchema.safeParse({
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
    })
})
