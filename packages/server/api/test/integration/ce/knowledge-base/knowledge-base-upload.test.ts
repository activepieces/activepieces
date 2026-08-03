import { FastifyInstance } from 'fastify'
import FormData from 'form-data'
import { StatusCodes } from 'http-status-codes'
import { createTestContext } from '../../../helpers/test-context'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'

let app: FastifyInstance

beforeAll(async () => {
    app = await setupTestEnvironment()
})

afterAll(async () => {
    await teardownTestEnvironment()
})

describe('POST /v1/knowledge-base/files/upload', () => {
    // The web UI appends the file before displayName, so field order must not matter.
    // Uses a multi-chunk file so busboy cannot have parsed the trailing field up front.
    it('should accept displayName appended after the file', async () => {
        const ctx = await createTestContext(app)

        const form = new FormData()
        form.append('file', Buffer.alloc(512 * 1024, 'a'), {
            filename: 'doc.txt',
            contentType: 'text/plain',
        })
        form.append('displayName', 'My Document')

        const response = await app.inject({
            method: 'POST',
            url: `/api/v1/knowledge-base/files/upload?projectId=${ctx.project.id}`,
            headers: {
                ...form.getHeaders(),
                authorization: `Bearer ${ctx.token}`,
            },
            payload: form.getBuffer(),
        })

        expect(response.statusCode).toBe(StatusCodes.CREATED)
        expect(response.json().displayName).toBe('My Document')
    })

    it('should accept displayName appended before the file', async () => {
        const ctx = await createTestContext(app)

        const form = new FormData()
        form.append('displayName', 'My Document')
        form.append('file', Buffer.from('hello text'), {
            filename: 'doc.txt',
            contentType: 'text/plain',
        })

        const response = await app.inject({
            method: 'POST',
            url: `/api/v1/knowledge-base/files/upload?projectId=${ctx.project.id}`,
            headers: {
                ...form.getHeaders(),
                authorization: `Bearer ${ctx.token}`,
            },
            payload: form.getBuffer(),
        })

        expect(response.statusCode).toBe(StatusCodes.CREATED)
        expect(response.json().displayName).toBe('My Document')
    })
})
