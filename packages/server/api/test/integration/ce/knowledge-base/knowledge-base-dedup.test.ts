import { apId, FileCompression, FileType } from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { databaseConnection } from '../../../../src/app/database/database-connection'
import { knowledgeBaseSchema } from '../../../../src/app/knowledge-base/knowledge-base-schema'
import { knowledgeBaseService } from '../../../../src/app/knowledge-base/knowledge-base.service'
import { db } from '../../../helpers/db'
import { createMockFile } from '../../../helpers/mocks'
import { createTestContext } from '../../../helpers/test-context'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'

let app: FastifyInstance

beforeAll(async () => {
    app = await setupTestEnvironment()
})

afterAll(async () => {
    await teardownTestEnvironment()
})

async function duplicatedChunks(): Promise<{ projectId: string, knowledgeBaseFileId: string }> {
    const ctx = await createTestContext(app)
    const file = createMockFile({
        projectId: ctx.project.id,
        platformId: ctx.platform.id,
        data: Buffer.from('The office closes at six.'),
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

    // The state an install carries if it stored the same file twice before the restore replaced
    // rather than appended, which the unique index refuses to build over.
    await databaseConnection().query('DROP INDEX IF EXISTS "uq_kb_chunk_file_index"')
    for (const [offset, content] of [['2026-01-01T00:00:00.000Z', 'the first write'], ['2026-02-01T00:00:00.000Z', 'the later write']] as const) {
        await databaseConnection().query(
            'INSERT INTO "knowledge_base_chunk" (id, created, updated, "projectId", "knowledgeBaseFileId", content, "chunkIndex", metadata) VALUES ($1, $2, $2, $3, $4, $5, 0, $6)',
            [apId(), offset, ctx.project.id, kbFile.id, content, JSON.stringify({})],
        )
    }
    return { projectId: ctx.project.id, knowledgeBaseFileId: kbFile.id }
}

describe('an install that already holds duplicate chunks', () => {
    it('keeps the later write and builds the index over what is left', async () => {
        const { projectId, knowledgeBaseFileId } = await duplicatedChunks()
        expect(await knowledgeBaseService(app.log).getChunkCount({ projectId, knowledgeBaseFileId })).toBe(2)

        await knowledgeBaseSchema.ensure(app.log)

        const chunks = await knowledgeBaseService(app.log).listChunks({ projectId, knowledgeBaseFileId })
        expect(chunks.length).toBe(1)
        expect(chunks[0].content).toBe('the later write')
        const indexes = await databaseConnection().query('SELECT indexname FROM pg_indexes WHERE indexname = $1', ['uq_kb_chunk_file_index'])
        expect(indexes.length).toBe(1)
    })

    it('refuses a duplicate once the index is there', async () => {
        const { projectId, knowledgeBaseFileId } = await duplicatedChunks()
        await knowledgeBaseSchema.ensure(app.log)

        await expect(databaseConnection().query(
            'INSERT INTO "knowledge_base_chunk" (id, created, updated, "projectId", "knowledgeBaseFileId", content, "chunkIndex", metadata) VALUES ($1, now(), now(), $2, $3, $4, 0, $5)',
            [apId(), projectId, knowledgeBaseFileId, 'a third copy', JSON.stringify({})],
        )).rejects.toThrow()
    })
})
