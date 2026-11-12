import { AIProviderName, apId } from '@activepieces/core-utils'
import { FileCompression, FileType, PrincipalType } from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import FormData from 'form-data'
import { StatusCodes } from 'http-status-codes'
import { KNOWLEDGE_BASE_FILE_HAS_NO_TEXT, KNOWLEDGE_BASE_NEEDS_AI_PROVIDER, knowledgeBaseService } from '../../../../src/app/knowledge-base/knowledge-base.service'
import { generateMockToken } from '../../../helpers/auth'
import { db } from '../../../helpers/db'
import { createMockFile, mockAndSaveAIProvider } from '../../../helpers/mocks'
import { createTestContext, TestContext } from '../../../helpers/test-context'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'

vi.mock('ai', async (importOriginal) => {
    const actual = await importOriginal<typeof import('ai')>()
    return {
        ...actual,
        embedMany: async ({ values }: { values: string[] }) => ({
            embeddings: values.map((value) => vectorFor(value)),
        }),
    }
})

let app: FastifyInstance

function vectorFor(text: string): number[] {
    const topic = text.includes('invoice') ? 1 : 0
    return Array.from({ length: 1536 }, (_, i) => (i === topic ? 1 : 0.01))
}

function search({ ctx, knowledgeBaseFileIds, query }: { ctx: TestContext, knowledgeBaseFileIds: string[], query: string }) {
    return generateMockToken({ type: PrincipalType.ENGINE, id: apId(), projectId: ctx.project.id, platform: { id: ctx.platform.id } }).then((engineToken) => app.inject({
        method: 'POST',
        url: '/api/v1/knowledge-base/files/search',
        headers: { authorization: `Bearer ${engineToken}` },
        body: { knowledgeBaseFileIds, queryEmbedding: vectorFor(query).slice(0, 768), limit: 1 },
    }))
}

function textFile({ name, content }: { name: string, content: string }): FormData {
    const form = new FormData()
    form.append('displayName', name)
    form.append('file', Buffer.from(content), { filename: name, contentType: name.endsWith('.csv') ? 'text/csv' : 'text/plain' })
    return form
}

beforeAll(async () => {
    app = await setupTestEnvironment()
})

afterAll(async () => {
    await teardownTestEnvironment()
})

async function contextWithProvider(): Promise<TestContext> {
    const ctx = await createTestContext(app)
    await mockAndSaveAIProvider({ platformId: ctx.platform.id, provider: AIProviderName.OPENAI, enabledForChat: true })
    return ctx
}

function upload({ ctx, form }: { ctx: TestContext, form: FormData }) {
    return app.inject({
        method: 'POST',
        url: `/api/v1/knowledge-base/files/upload?projectId=${ctx.project.id}`,
        headers: {
            ...form.getHeaders(),
            authorization: `Bearer ${ctx.token}`,
        },
        payload: form.getBuffer(),
    })
}

describe('POST /v1/knowledge-base/files/upload', () => {
    // The web UI appends the file before displayName, so field order must not matter.
    // Uses a multi-chunk file so busboy cannot have parsed the trailing field up front.
    it('should accept displayName appended after the file', async () => {
        const ctx = await contextWithProvider()

        const form = new FormData()
        form.append('file', Buffer.alloc(512 * 1024, 'a'), {
            filename: 'doc.txt',
            contentType: 'text/plain',
        })
        form.append('displayName', 'My Document')

        const response = await upload({ ctx, form })

        expect(response.statusCode).toBe(StatusCodes.CREATED)
        expect(response.json().displayName).toBe('My Document')
    })

    it('should accept displayName appended before the file', async () => {
        const ctx = await contextWithProvider()

        const form = new FormData()
        form.append('displayName', 'My Document')
        form.append('file', Buffer.from('hello text'), {
            filename: 'doc.txt',
            contentType: 'text/plain',
        })

        const response = await upload({ ctx, form })

        expect(response.statusCode).toBe(StatusCodes.CREATED)
        expect(response.json().displayName).toBe('My Document')
    })

    it('finds the uploaded text when searched, not just any chunk', async () => {
        const ctx = await contextWithProvider()
        const handbook = await upload({ ctx, form: textFile({ name: 'handbook.txt', content: 'The office closes at six.' }) })
        const billing = await upload({ ctx, form: textFile({ name: 'billing.txt', content: 'Every invoice is due in thirty days.' }) })

        const response = await search({ ctx, knowledgeBaseFileIds: [handbook.json().id, billing.json().id], query: 'when is an invoice due' })

        expect(response.json().map((row: { content: string }) => row.content)).toEqual(['Every invoice is due in thirty days.'])
    })

    it('embeds every chunk an old upload left unembedded, however long the file', async () => {
        const ctx = await contextWithProvider()
        const service = knowledgeBaseService(app.log)
        const storedFile = createMockFile({ projectId: ctx.project.id, platformId: ctx.platform.id, data: Buffer.from('x'), type: FileType.KNOWLEDGE_BASE, compression: FileCompression.NONE, fileName: 'old.txt' })
        await db.save('file', storedFile)
        const file = await service.createFile({ projectId: ctx.project.id, fileId: storedFile.id, displayName: 'Old upload' })
        const chunkCount = 250
        await service.storeChunks({ projectId: ctx.project.id, knowledgeBaseFileId: file.id, chunks: Array.from({ length: chunkCount }, (_, chunkIndex) => ({ content: `Part ${chunkIndex}`, chunkIndex })) })

        const embedded = await service.embedMissingChunks({ projectId: ctx.project.id, knowledgeBaseFileId: file.id, resolveEmbedFn: async () => async (texts) => texts.map(() => vectorFor('').slice(0, 768)) })

        expect(embedded).toBe(chunkCount)
        expect(await service.listChunks({ projectId: ctx.project.id, knowledgeBaseFileId: file.id, embedded: false })).toHaveLength(0)
    })

    it('does not count a file as searchable while any of its chunks is unindexed', async () => {
        const ctx = await contextWithProvider()
        const service = knowledgeBaseService(app.log)
        const storedFile = createMockFile({ projectId: ctx.project.id, platformId: ctx.platform.id, data: Buffer.from('x'), type: FileType.KNOWLEDGE_BASE, compression: FileCompression.NONE, fileName: 'old.txt' })
        await db.save('file', storedFile)
        const file = await service.createFile({ projectId: ctx.project.id, fileId: storedFile.id, displayName: 'Half indexed' })
        await service.storeChunks({ projectId: ctx.project.id, knowledgeBaseFileId: file.id, chunks: [
            { content: 'The office closes at six.', chunkIndex: 0, embedding: vectorFor('office').slice(0, 768) },
            { content: 'Every invoice is due in thirty days.', chunkIndex: 1 },
        ] })

        expect(await service.isSearchable({ projectId: ctx.project.id, knowledgeBaseFileId: file.id })).toBe(false)
    })

    it('does not save an embedding onto a chunk whose text changed while it was being embedded', async () => {
        const ctx = await contextWithProvider()
        const service = knowledgeBaseService(app.log)
        const storedFile = createMockFile({ projectId: ctx.project.id, platformId: ctx.platform.id, data: Buffer.from('x'), type: FileType.KNOWLEDGE_BASE, compression: FileCompression.NONE, fileName: 'old.txt' })
        await db.save('file', storedFile)
        const file = await service.createFile({ projectId: ctx.project.id, fileId: storedFile.id, displayName: 'Edited meanwhile' })
        await service.storeChunks({ projectId: ctx.project.id, knowledgeBaseFileId: file.id, chunks: [{ content: 'The office closes at six.', chunkIndex: 0 }] })
        const [chunk] = await service.listChunks({ projectId: ctx.project.id, knowledgeBaseFileId: file.id })

        await service.embedMissingChunks({ projectId: ctx.project.id, knowledgeBaseFileId: file.id, resolveEmbedFn: async () => async (texts) => {
            await service.storeChunks({ projectId: ctx.project.id, knowledgeBaseFileId: file.id, chunks: [{ id: chunk.id, content: 'The office now closes at five.' }] })
            return texts.map(() => vectorFor('').slice(0, 768))
        } })

        expect(await service.listChunks({ projectId: ctx.project.id, knowledgeBaseFileId: file.id, embedded: false })).toHaveLength(1)
    })

    it('does not index an old upload from the read-only search route', async () => {
        const ctx = await contextWithProvider()
        const service = knowledgeBaseService(app.log)
        const storedFile = createMockFile({ projectId: ctx.project.id, platformId: ctx.platform.id, data: Buffer.from('x'), type: FileType.KNOWLEDGE_BASE, compression: FileCompression.NONE, fileName: 'old.txt' })
        await db.save('file', storedFile)
        const file = await service.createFile({ projectId: ctx.project.id, fileId: storedFile.id, displayName: 'Old upload' })
        await service.storeChunks({ projectId: ctx.project.id, knowledgeBaseFileId: file.id, chunks: [{ content: 'The office closes at six.', chunkIndex: 0 }] })

        const response = await search({ ctx, knowledgeBaseFileIds: [file.id], query: 'office' })

        expect(response.json()).toHaveLength(0)
        expect(await service.isSearchable({ projectId: ctx.project.id, knowledgeBaseFileId: file.id })).toBe(false)
    })

    it.each([
        { name: 'blank.txt', content: '   \n  ' },
        { name: 'headers.csv', content: 'name,age\n' },
    ])('refuses $name, which has no text to search, instead of listing it as uploaded', async ({ name, content }) => {
        const ctx = await contextWithProvider()

        const response = await upload({ ctx, form: textFile({ name, content }) })

        expect(response.statusCode).toBe(StatusCodes.CONFLICT)
        expect(response.json().params.message).toBe(KNOWLEDGE_BASE_FILE_HAS_NO_TEXT)
        expect(await db.findBy('knowledge_base_file', { projectId: ctx.project.id })).toHaveLength(0)
        expect(await db.findBy('file', { projectId: ctx.project.id })).toHaveLength(0)
    })

    it('refuses the upload when no AI provider can index it, instead of storing an unsearchable file', async () => {
        const ctx = await createTestContext(app)

        const response = await upload({ ctx, form: textFile({ name: 'doc.txt', content: 'The office closes at six.' }) })

        expect(response.statusCode).toBe(StatusCodes.CONFLICT)
        expect(response.json().params.message).toBe(KNOWLEDGE_BASE_NEEDS_AI_PROVIDER)
        expect(await db.findBy('knowledge_base_file', { projectId: ctx.project.id })).toHaveLength(0)
    })
})
