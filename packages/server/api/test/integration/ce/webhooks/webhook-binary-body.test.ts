import { AddressInfo } from 'net'
import { apId, FileType, Flow, FlowStatus, Project } from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { db } from '../../../helpers/db'
import { createMockFlow, createMockFlowVersion, mockAndSaveBasicSetup } from '../../../helpers/mocks'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'

let app: FastifyInstance
let baseUrl: string

beforeAll(async () => {
    app = await setupTestEnvironment()
    await app.listen({ port: 0, host: '127.0.0.1' })
    const { port } = app.server.address() as AddressInfo
    baseUrl = `http://127.0.0.1:${port}`
})

afterAll(async () => {
    await new Promise<void>((resolve) => app.server.close(() => resolve()))
    await teardownTestEnvironment()
})

describe('Webhook binary body', () => {
    it('streams an application/octet-stream body to storage and returns it as a file', async () => {
        const { mockFlow, mockProject } = await createEnabledFlow()
        const payload = Buffer.from('some binary payload')

        const response = await app.inject({
            method: 'POST',
            url: `/api/v1/webhooks/${mockFlow.id}`,
            headers: { 'content-type': 'application/octet-stream' },
            payload,
        })

        expect(response.statusCode).toBe(StatusCodes.OK)
        expect(response.headers['x-webhook-id']).toBeDefined()

        const savedFile = await db.findOneBy<SavedFile>(
            'file',
            { projectId: mockProject.id, type: FileType.FLOW_STEP_FILE },
        )
        expect(savedFile).not.toBeNull()
        expect(savedFile!.id).toBeTruthy()
        expect(savedFile!.type).toBe(FileType.FLOW_STEP_FILE)
        expect(savedFile!.size).toBe(payload.length)
        expect(Buffer.from(savedFile!.data).toString()).toBe(payload.toString())
    })

    it('preserves the body bytes over a real HTTP socket (not just app.inject)', async () => {
        const { mockFlow, mockProject } = await createEnabledFlow()
        const payload = Buffer.from('real socket binary body '.repeat(1000))

        const response = await fetch(`${baseUrl}/api/v1/webhooks/${mockFlow.id}`, {
            method: 'POST',
            headers: { 'content-type': 'application/octet-stream' },
            body: payload,
        })

        expect(response.status).toBe(StatusCodes.OK)

        const savedFile = await db.findOneBy<SavedFile>(
            'file',
            { projectId: mockProject.id, type: FileType.FLOW_STEP_FILE },
        )
        expect(savedFile).not.toBeNull()
        expect(savedFile!.size).toBe(payload.length)
        expect(Buffer.from(savedFile!.data).length).toBe(payload.length)
    })

    it('returns GONE for a binary upload to an unknown flow', async () => {
        const response = await app.inject({
            method: 'POST',
            url: `/api/v1/webhooks/${apId()}`,
            headers: { 'content-type': 'application/octet-stream' },
            payload: Buffer.from('should never be stored'),
        })

        // No parse-time flow lookup anymore: the handler resolves the flow and returns GONE.
        // The DB path buffers the body then discards it (the file save only runs in the handler,
        // which is never reached), so nothing is stored. (On S3 an orphan object is left behind.)
        expect(response.statusCode).toBe(StatusCodes.GONE)
    })

    it('returns NOT_FOUND for a disabled flow and stores no file on the DB path', async () => {
        const { mockProject } = await mockAndSaveBasicSetup()
        const mockFlow = createMockFlow({ projectId: mockProject.id, status: FlowStatus.DISABLED })
        await db.save('flow', [mockFlow])
        const mockFlowVersion = createMockFlowVersion({ flowId: mockFlow.id })
        await db.save('flow_version', [mockFlowVersion])
        await db.update('flow', mockFlow.id, { publishedVersionId: mockFlowVersion.id })

        const response = await app.inject({
            method: 'POST',
            url: `/api/v1/webhooks/${mockFlow.id}`,
            headers: { 'content-type': 'application/octet-stream' },
            payload: Buffer.from('never reaches the handler save'),
        })

        expect(response.statusCode).toBe(StatusCodes.NOT_FOUND)
        // On the DB path the file is saved in the handler via the data() callback, which the
        // disabled-flow guard returns before — so no file is written. (On S3 the parse-time
        // upload leaves an orphan object; that is the accepted no-validation tradeoff.)
        const savedFile = await db.findOneBy<SavedFile>(
            'file',
            { projectId: mockProject.id, type: FileType.FLOW_STEP_FILE },
        )
        expect(savedFile).toBeNull()
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
    size: number
    data: Buffer
}
