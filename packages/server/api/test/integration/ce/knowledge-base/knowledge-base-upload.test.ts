import { AIProviderName, apId } from '@activepieces/core-utils'
import { FileCompression, FileType, PrincipalType } from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import FormData from 'form-data'
import { StatusCodes } from 'http-status-codes'
import { knowledgeBaseService } from '../../../../src/app/knowledge-base/knowledge-base.service'
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
            embeddings: values.map(() => Array.from({ length: 1536 }, (_, i) => (i === 0 ? 1 : 0.5))),
        }),
    }
})

let app: FastifyInstance

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

    it('indexes the upload so the agent can search it', async () => {
        const ctx = await contextWithProvider()

        const form = new FormData()
        form.append('displayName', 'Handbook')
        form.append('file', Buffer.from('The office closes at six.'), { filename: 'doc.txt', contentType: 'text/plain' })

        const response = await upload({ ctx, form })

        expect(response.statusCode).toBe(StatusCodes.CREATED)
        const searchable = await knowledgeBaseService(app.log).isSearchable({ projectId: ctx.project.id, knowledgeBaseFileId: response.json().id })
        expect(searchable).toBe(true)
    })

    it('embeds chunks left unembedded by an old upload when the file is searched', async () => {
        const ctx = await contextWithProvider()
        const service = knowledgeBaseService(app.log)
        const storedFile = createMockFile({ projectId: ctx.project.id, platformId: ctx.platform.id, data: Buffer.from('x'), type: FileType.KNOWLEDGE_BASE, compression: FileCompression.NONE, fileName: 'old.txt' })
        await db.save('file', storedFile)
        const file = await service.createFile({ projectId: ctx.project.id, fileId: storedFile.id, displayName: 'Old upload' })
        await service.storeChunks({ projectId: ctx.project.id, knowledgeBaseFileId: file.id, chunks: [{ content: 'The office closes at six.', chunkIndex: 0 }] })
        expect(await service.isSearchable({ projectId: ctx.project.id, knowledgeBaseFileId: file.id })).toBe(false)

        const engineToken = await generateMockToken({ type: PrincipalType.ENGINE, id: apId(), projectId: ctx.project.id, platform: { id: ctx.platform.id } })

        const response = await app.inject({
            method: 'POST',
            url: '/api/v1/knowledge-base/files/search',
            headers: { authorization: `Bearer ${engineToken}` },
            body: { knowledgeBaseFileIds: [file.id], queryEmbedding: Array.from({ length: 768 }, (_, i) => (i === 0 ? 1 : 0.5)) },
        })

        expect(response.statusCode).toBe(StatusCodes.OK)
        expect(response.json()).toHaveLength(1)
        expect(await service.isSearchable({ projectId: ctx.project.id, knowledgeBaseFileId: file.id })).toBe(true)
    })

    it('refuses the upload when no AI provider can index it, instead of storing an unsearchable file', async () => {
        const ctx = await createTestContext(app)

        const form = new FormData()
        form.append('displayName', 'Handbook')
        form.append('file', Buffer.from('The office closes at six.'), { filename: 'doc.txt', contentType: 'text/plain' })

        const response = await upload({ ctx, form })

        expect(response.statusCode).toBe(StatusCodes.CONFLICT)
        expect(await db.findBy('knowledge_base_file', { projectId: ctx.project.id })).toHaveLength(0)
    })
})
