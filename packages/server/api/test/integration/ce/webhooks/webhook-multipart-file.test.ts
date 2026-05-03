import { FileType, Flow, FlowStatus, Project } from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import FormData from 'form-data'
import { StatusCodes } from 'http-status-codes'
import { db } from '../../../helpers/db'
import { createMockFlow, createMockFlowVersion, mockAndSaveBasicSetup } from '../../../helpers/mocks'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'

let app: FastifyInstance

beforeAll(async () => {
    app = await setupTestEnvironment()
})

afterAll(async () => {
    await teardownTestEnvironment()
})

describe('Webhook multipart file', () => {
    it('should serialize a single multipart file as a URL and persist it', async () => {
        const { mockFlow, mockProject } = await createEnabledFlow()

        const form = new FormData()
        form.append('userName', 'John')
        form.append('upload', Buffer.from('hello pdf'), {
            filename: 'doc.pdf',
            contentType: 'application/pdf',
        })

        const response = await app.inject({
            method: 'POST',
            url: `/api/v1/webhooks/${mockFlow.id}`,
            headers: form.getHeaders(),
            payload: form.getBuffer(),
        })

        expect(response.statusCode).toBe(StatusCodes.OK)
        expect(response.headers['x-webhook-id']).toBeDefined()
        expect(response.json()).toEqual({})

        const savedFile = await db.findOneBy<SavedFile>(
            'file',
            { projectId: mockProject.id, type: FileType.FLOW_STEP_FILE },
        )
        expect(savedFile).not.toBeNull()
        expect(savedFile!.id).toBeTruthy()
        expect(savedFile!.fileName).toBe('doc.pdf')
        expect(savedFile!.type).toBe(FileType.FLOW_STEP_FILE)
        expect(savedFile!.projectId).toBe(mockProject.id)
    })

    it('should serialize multiple multipart files sharing a field name as an array of URLs', async () => {
        const { mockFlow, mockProject } = await createEnabledFlow()

        const form = new FormData()
        form.append('uploads', Buffer.from('first pdf'), {
            filename: 'first.pdf',
            contentType: 'application/pdf',
        })
        form.append('uploads', Buffer.from('second pdf'), {
            filename: 'second.pdf',
            contentType: 'application/pdf',
        })

        const response = await app.inject({
            method: 'POST',
            url: `/api/v1/webhooks/${mockFlow.id}`,
            headers: form.getHeaders(),
            payload: form.getBuffer(),
        })

        expect(response.statusCode).toBe(StatusCodes.OK)
        expect(response.headers['x-webhook-id']).toBeDefined()
        expect(response.json()).toEqual({})

        const firstFile = await db.findOneBy<SavedFile>(
            'file',
            { projectId: mockProject.id, fileName: 'first.pdf' },
        )
        const secondFile = await db.findOneBy<SavedFile>(
            'file',
            { projectId: mockProject.id, fileName: 'second.pdf' },
        )
        expect(firstFile).not.toBeNull()
        expect(firstFile!.id).toBeTruthy()
        expect(firstFile!.type).toBe(FileType.FLOW_STEP_FILE)
        expect(secondFile).not.toBeNull()
        expect(secondFile!.id).toBeTruthy()
        expect(secondFile!.type).toBe(FileType.FLOW_STEP_FILE)
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
    id: string
    fileName: string
    type: FileType
    projectId: string
}
