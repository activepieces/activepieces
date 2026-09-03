import { FileCompression, FileType } from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { knowledgeBaseService } from '../../../../src/app/knowledge-base/knowledge-base.service'
import { db } from '../../../helpers/db'
import { createMockFile } from '../../../helpers/mocks'
import { createTestContext, TestContext } from '../../../helpers/test-context'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'

let app: FastifyInstance

beforeAll(async () => {
    app = await setupTestEnvironment()
})

afterAll(async () => {
    await teardownTestEnvironment()
})

const NUL = String.fromCharCode(0)

async function aFileOf(ctx: TestContext, content: string): Promise<string> {
    const file = createMockFile({
        projectId: ctx.project.id,
        platformId: ctx.platform.id,
        data: Buffer.from(content),
        type: FileType.KNOWLEDGE_BASE,
        compression: FileCompression.NONE,
        fileName: 'handbook.txt',
    })
    await db.save('file', file)
    const kbFile = await knowledgeBaseService(app.log).createFile({
        projectId: ctx.project.id,
        fileId: file.id,
        displayName: 'Handbook',
    })
    return kbFile.id
}

function countOf(ctx: TestContext, knowledgeBaseFileId: string): Promise<number> {
    return knowledgeBaseService(app.log).getChunkCount({ projectId: ctx.project.id, knowledgeBaseFileId })
}

describe('storing the chunks of a knowledge file', () => {
    it('replaces what was there rather than stacking a second copy on top', async () => {
        const ctx = await createTestContext(app)
        const knowledgeBaseFileId = await aFileOf(ctx, 'The office closes at six.')
        const chunks = [{ content: 'The office closes at six.', chunkIndex: 0, metadata: {} }]

        await knowledgeBaseService(app.log).storeChunks({ projectId: ctx.project.id, knowledgeBaseFileId, chunks })
        await knowledgeBaseService(app.log).storeChunks({ projectId: ctx.project.id, knowledgeBaseFileId, chunks })

        expect(await countOf(ctx, knowledgeBaseFileId)).toBe(1)
    })

    // A document is allowed to contain a NUL byte and Postgres rejects one in a text column. Left
    // to fail part way through, it commits a prefix and leaves the file looking whole.
    it('keeps a file whole: either every chunk is stored or none is', async () => {
        const ctx = await createTestContext(app)
        const knowledgeBaseFileId = await aFileOf(ctx, 'text')
        // Inserts run in batches of 100, so the rejected chunk has to land in a later batch for a
        // partial commit to be possible at all.
        const chunks = Array.from({ length: 150 }, (_, index) => ({
            content: index === 120 ? `a chunk with a ${NUL} in it` : `readable chunk ${index}`,
            chunkIndex: index,
            metadata: {},
        }))

        const outcome = await knowledgeBaseService(app.log).storeChunks({ projectId: ctx.project.id, knowledgeBaseFileId, chunks })
            .then(() => 'stored' as const)
            .catch(() => 'refused' as const)

        const count = await countOf(ctx, knowledgeBaseFileId)
        expect(outcome === 'stored' ? count : 0).toBe(outcome === 'stored' ? chunks.length : 0)
    })

    // Two restores of the same file used to delete each other's snapshot and then insert
    // independently, putting back exactly the duplicates this replace was meant to remove.
    it('keeps one copy when two restores of the same file overlap', async () => {
        const ctx = await createTestContext(app)
        const knowledgeBaseFileId = await aFileOf(ctx, 'The office closes at six.')
        const chunks = Array.from({ length: 3 }, (_, index) => ({
            content: `chunk ${index}`,
            chunkIndex: index,
            metadata: {},
        }))

        await Promise.all([
            knowledgeBaseService(app.log).storeChunks({ projectId: ctx.project.id, knowledgeBaseFileId, chunks }),
            knowledgeBaseService(app.log).storeChunks({ projectId: ctx.project.id, knowledgeBaseFileId, chunks }),
        ])

        expect(await countOf(ctx, knowledgeBaseFileId)).toBe(chunks.length)
    })

    // A restore used to give every chunk a new id, so an id read before one was useless after it.
    // Keeping the id lets an edit that was queued behind a restore still land on its own row.
    it('keeps a chunk id across a restore, so an edit behind one still lands', async () => {
        const ctx = await createTestContext(app)
        const knowledgeBaseFileId = await aFileOf(ctx, 'The office closes at six.')
        await knowledgeBaseService(app.log).storeChunks({
            projectId: ctx.project.id,
            knowledgeBaseFileId,
            chunks: [{ content: 'first', chunkIndex: 0, metadata: {} }],
        })
        const [before] = await knowledgeBaseService(app.log).listChunks({ projectId: ctx.project.id, knowledgeBaseFileId })

        await knowledgeBaseService(app.log).storeChunks({
            projectId: ctx.project.id,
            knowledgeBaseFileId,
            chunks: [{ content: 'restored', chunkIndex: 0, metadata: {} }],
        })
        const [afterRestore] = await knowledgeBaseService(app.log).listChunks({ projectId: ctx.project.id, knowledgeBaseFileId })
        expect(afterRestore.id).toBe(before.id)
        expect(afterRestore.content).toBe('restored')

        await knowledgeBaseService(app.log).storeChunks({
            projectId: ctx.project.id,
            knowledgeBaseFileId,
            chunks: [{ id: before.id, content: 'an edit queued behind the restore' }],
        })

        const [afterEdit] = await knowledgeBaseService(app.log).listChunks({ projectId: ctx.project.id, knowledgeBaseFileId })
        expect(afterEdit.content).toBe('an edit queued behind the restore')
    })

    it('drops the tail when a document comes back shorter', async () => {
        const ctx = await createTestContext(app)
        const knowledgeBaseFileId = await aFileOf(ctx, 'long then short')
        const three = Array.from({ length: 3 }, (_, index) => ({ content: `chunk ${index}`, chunkIndex: index, metadata: {} }))

        await knowledgeBaseService(app.log).storeChunks({ projectId: ctx.project.id, knowledgeBaseFileId, chunks: three })
        await knowledgeBaseService(app.log).storeChunks({ projectId: ctx.project.id, knowledgeBaseFileId, chunks: three.slice(0, 1) })

        expect(await countOf(ctx, knowledgeBaseFileId)).toBe(1)
    })

    it('still refuses an update against a chunk that does not exist at all', async () => {
        const ctx = await createTestContext(app)
        const knowledgeBaseFileId = await aFileOf(ctx, 'text')

        await expect(knowledgeBaseService(app.log).storeChunks({
            projectId: ctx.project.id,
            knowledgeBaseFileId,
            chunks: [{ id: 'chunk-that-never-existed', content: 'an edit' }],
        })).rejects.toThrow()
    })
})
