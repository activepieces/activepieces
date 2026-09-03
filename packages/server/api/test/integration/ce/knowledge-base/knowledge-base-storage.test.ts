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

    // A restore used to delete and recreate every row, so an id read before one was useless
    // after it. Writing in place keeps the id, so an edit queued behind a restore still lands.
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

    // A caller is free to number the chunks it sends. Treating the count as an upper bound on the
    // index deleted the very rows the request had just written.
    it('keeps every submitted chunk when the indexes are not contiguous', async () => {
        const ctx = await createTestContext(app)
        const knowledgeBaseFileId = await aFileOf(ctx, 'sparse indexes')

        await knowledgeBaseService(app.log).storeChunks({
            projectId: ctx.project.id,
            knowledgeBaseFileId,
            chunks: [
                { content: 'first', chunkIndex: 0, metadata: {} },
                { content: 'third', chunkIndex: 2, metadata: {} },
            ],
        })

        const stored = await knowledgeBaseService(app.log).listChunks({ projectId: ctx.project.id, knowledgeBaseFileId })
        expect(stored.map((chunk) => chunk.content).sort()).toEqual(['first', 'third'])
    })

    // Two chunks numbered the same are one place in the file, not two rows in it. Deciding that
    // against the snapshot alone missed a repeat the payload carried itself.
    it('stores one chunk when a restore repeats an index', async () => {
        const ctx = await createTestContext(app)
        const knowledgeBaseFileId = await aFileOf(ctx, 'a repeated index')

        await knowledgeBaseService(app.log).storeChunks({
            projectId: ctx.project.id,
            knowledgeBaseFileId,
            chunks: [
                { content: 'the first copy', chunkIndex: 4, metadata: {} },
                { content: 'the second copy', chunkIndex: 4, metadata: {} },
            ],
        })

        const stored = await knowledgeBaseService(app.log).listChunks({ projectId: ctx.project.id, knowledgeBaseFileId })
        expect(stored).toHaveLength(1)
        expect(stored[0].content).toBe('the second copy')
    })

    // An append alongside an edit went in blind, so the same collision the restore path had just
    // learned to avoid was still reachable one field away.
    it('stores one chunk when an append beside an edit repeats an index', async () => {
        const ctx = await createTestContext(app)
        const knowledgeBaseFileId = await aFileOf(ctx, 'an append beside an edit')
        await knowledgeBaseService(app.log).storeChunks({
            projectId: ctx.project.id,
            knowledgeBaseFileId,
            chunks: [{ content: 'first', chunkIndex: 0, metadata: {} }],
        })
        const [existing] = await knowledgeBaseService(app.log).listChunks({ projectId: ctx.project.id, knowledgeBaseFileId })

        await knowledgeBaseService(app.log).storeChunks({
            projectId: ctx.project.id,
            knowledgeBaseFileId,
            chunks: [
                { id: existing.id, content: 'an edit' },
                { content: 'an append onto the same place', chunkIndex: 0, metadata: {} },
            ],
        })

        const stored = await knowledgeBaseService(app.log).listChunks({ projectId: ctx.project.id, knowledgeBaseFileId })
        expect(stored).toHaveLength(1)
        expect(stored[0].content).toBe('an append onto the same place')
    })

    // Moving a chunk onto a position another chunk already holds is a move, not a second copy.
    it('leaves one chunk behind when an edit moves onto an occupied index', async () => {
        const ctx = await createTestContext(app)
        const knowledgeBaseFileId = await aFileOf(ctx, 'a move onto an occupied place')
        await knowledgeBaseService(app.log).storeChunks({
            projectId: ctx.project.id,
            knowledgeBaseFileId,
            chunks: [
                { content: 'the first place', chunkIndex: 0, metadata: {} },
                { content: 'the second place', chunkIndex: 1, metadata: {} },
            ],
        })
        const stored = await knowledgeBaseService(app.log).listChunks({ projectId: ctx.project.id, knowledgeBaseFileId })
        const moving = stored.find((chunk) => chunk.content === 'the first place')

        await knowledgeBaseService(app.log).storeChunks({
            projectId: ctx.project.id,
            knowledgeBaseFileId,
            chunks: [{ id: moving?.id, chunkIndex: 1 }],
        })

        const after = await knowledgeBaseService(app.log).listChunks({ projectId: ctx.project.id, knowledgeBaseFileId })
        expect(after).toHaveLength(1)
        expect(after[0].content).toBe('the first place')
        expect(after[0].id).toBe(moving?.id)
    })

    // A row a move has already claimed cannot also be the row an append lands on. Adopting it made
    // both writes touch one row, so the move was overwritten and the file lost a chunk.
    it('honours a move and an append onto the place it left', async () => {
        const ctx = await createTestContext(app)
        const knowledgeBaseFileId = await aFileOf(ctx, 'a move and an append')
        await knowledgeBaseService(app.log).storeChunks({
            projectId: ctx.project.id,
            knowledgeBaseFileId,
            chunks: [
                { content: 'the moving chunk', chunkIndex: 0, metadata: {} },
                { content: 'the chunk it lands on', chunkIndex: 1, metadata: {} },
            ],
        })
        const stored = await knowledgeBaseService(app.log).listChunks({ projectId: ctx.project.id, knowledgeBaseFileId })
        const moving = stored.find((chunk) => chunk.content === 'the moving chunk')

        await knowledgeBaseService(app.log).storeChunks({
            projectId: ctx.project.id,
            knowledgeBaseFileId,
            chunks: [
                { id: moving?.id, chunkIndex: 1 },
                { content: 'the append', chunkIndex: 0, metadata: {} },
            ],
        })

        const after = await knowledgeBaseService(app.log).listChunks({ projectId: ctx.project.id, knowledgeBaseFileId })
        expect(after).toHaveLength(2)
        expect(after.find((chunk) => chunk.chunkIndex === 1)?.content).toBe('the moving chunk')
        expect(after.find((chunk) => chunk.chunkIndex === 1)?.id).toBe(moving?.id)
        expect(after.find((chunk) => chunk.chunkIndex === 0)?.content).toBe('the append')
    })

    // A file that comes back with nothing in it has nothing in it. Returning early left the
    // previous text in place, so the agent kept answering from a document that had been emptied.
    it('clears the file when a restore carries no chunks', async () => {
        const ctx = await createTestContext(app)
        const knowledgeBaseFileId = await aFileOf(ctx, 'something then nothing')
        await knowledgeBaseService(app.log).storeChunks({
            projectId: ctx.project.id,
            knowledgeBaseFileId,
            chunks: [{ content: 'the old text', chunkIndex: 0, metadata: {} }],
        })

        await knowledgeBaseService(app.log).storeChunks({ projectId: ctx.project.id, knowledgeBaseFileId, chunks: [] })

        expect(await countOf(ctx, knowledgeBaseFileId)).toBe(0)
    })

    it('refuses an update against an id that names no row', async () => {
        const ctx = await createTestContext(app)
        const knowledgeBaseFileId = await aFileOf(ctx, 'text')

        await expect(knowledgeBaseService(app.log).storeChunks({
            projectId: ctx.project.id,
            knowledgeBaseFileId,
            chunks: [{ id: 'chunk-that-never-existed', content: 'an edit' }],
        })).rejects.toThrow()
    })

    // The lock is taken on the file the request names, so an edit that reaches into another file
    // is neither scoped nor serialised by it.
    it('refuses an edit that names one file and a chunk from another', async () => {
        const ctx = await createTestContext(app)
        const mine = await aFileOf(ctx, 'mine')
        const theirs = await aFileOf(ctx, 'theirs')
        await knowledgeBaseService(app.log).storeChunks({
            projectId: ctx.project.id,
            knowledgeBaseFileId: theirs,
            chunks: [{ content: 'their content', chunkIndex: 0, metadata: {} }],
        })
        const [theirChunk] = await knowledgeBaseService(app.log).listChunks({ projectId: ctx.project.id, knowledgeBaseFileId: theirs })

        await expect(knowledgeBaseService(app.log).storeChunks({
            projectId: ctx.project.id,
            knowledgeBaseFileId: mine,
            chunks: [{ id: theirChunk.id, content: 'reaching into another file' }],
        })).rejects.toThrow()

        const [unchanged] = await knowledgeBaseService(app.log).listChunks({ projectId: ctx.project.id, knowledgeBaseFileId: theirs })
        expect(unchanged.content).toBe('their content')
    })
})
