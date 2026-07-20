// Must be set before the server reads it to size @fastify/multipart's fileSize limit.
process.env.AP_MAX_FILE_SIZE_MB = '1'

import { FileType, Flow, FlowStatus, Project } from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import FormData from 'form-data'
import { StatusCodes } from 'http-status-codes'
import { db } from '../../../helpers/db'
import { createMockFlow, createMockFlowVersion, mockAndSaveBasicSetup } from '../../../helpers/mocks'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'

let app: FastifyInstance

beforeAll(async () => {
    app = await setupTestEnvironment({ fresh: true })
})

afterAll(async () => {
    await teardownTestEnvironment()
})

const OVERSIZED_PAYLOAD = Buffer.alloc(2 * 1024 * 1024, 'a')

describe('Webhook oversized file', () => {
    it('should reject an oversized multipart file without persisting a truncated one', async () => {
        const { mockFlow, mockProject } = await createEnabledFlow()

        const form = new FormData()
        form.append('upload', OVERSIZED_PAYLOAD, {
            filename: 'big.pdf',
            contentType: 'application/pdf',
        })

        const response = await app.inject({
            method: 'POST',
            url: `/api/v1/webhooks/${mockFlow.id}`,
            headers: form.getHeaders(),
            payload: form.getBuffer(),
        })

        expect(response.statusCode).not.toBe(StatusCodes.OK)

        const savedFile = await db.findOneBy<SavedFile>(
            'file',
            { projectId: mockProject.id, type: FileType.FLOW_STEP_FILE },
        )
        expect(savedFile).toBeNull()
    })

    it('should reject an oversized raw binary body without persisting a truncated one', async () => {
        const { mockFlow, mockProject } = await createEnabledFlow()

        const response = await app.inject({
            method: 'POST',
            url: `/api/v1/webhooks/${mockFlow.id}`,
            headers: { 'content-type': 'application/pdf' },
            payload: OVERSIZED_PAYLOAD,
        })

        expect(response.statusCode).not.toBe(StatusCodes.OK)

        const savedFile = await db.findOneBy<SavedFile>(
            'file',
            { projectId: mockProject.id, type: FileType.FLOW_STEP_FILE },
        )
        expect(savedFile).toBeNull()
    })

    it('should still accept a multipart file within the limit', async () => {
        const { mockFlow, mockProject } = await createEnabledFlow()

        const form = new FormData()
        form.append('upload', Buffer.alloc(512 * 1024, 'a'), {
            filename: 'small.pdf',
            contentType: 'application/pdf',
        })

        const response = await app.inject({
            method: 'POST',
            url: `/api/v1/webhooks/${mockFlow.id}`,
            headers: form.getHeaders(),
            payload: form.getBuffer(),
        })

        expect(response.statusCode).toBe(StatusCodes.OK)

        const savedFile = await db.findOneBy<SavedFile>(
            'file',
            { projectId: mockProject.id, type: FileType.FLOW_STEP_FILE },
        )
        expect(savedFile).not.toBeNull()
        expect(savedFile!.fileName).toBe('small.pdf')
    })
})

async function createEnabledFlow(): Promise<{ mockFlow: Flow, mockProject: Project }> {
    const { mockProject } = await mockAndSaveBasicSetup()
    const mockFlow = createMockFlow({ projectId: mockProject.id, status: FlowStatus.ENABLED })
    await db.save('flow', [mockFlow])
    const mockFlowVersion = createMockFlowVersion({ flowId: mockFlow.id })
    await db.save('flow_version', [mockFlowVersion])
    await db.update('flow', mockFlow.id, { publishedVersionId: mockFlowVersion.id })
    return { mockFlow, mockProject }
}

type SavedFile = {
    fileName: string
}
