import { createHmac } from 'node:crypto'
import { FileType, Flow, FlowStatus, Project } from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { db } from '../../../helpers/db'
import { createMockFlow, createMockFlowVersion, mockAndSaveBasicSetup } from '../../../helpers/mocks'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'

const SECRET = 'shared-secret'
const BOUNDARY = '----signatureBoundary'
const CAPTURE_LIMIT_BYTES = 512 * 1024

let app: FastifyInstance

beforeAll(async () => {
    app = await setupTestEnvironment()
})

afterAll(async () => {
    await teardownTestEnvironment()
})

describe('Webhook rawBody capture for signature verification', () => {
    it('captures rawBody for multipart so a signature over the sent bytes verifies', async () => {
        const { mockFlow, mockProject } = await createEnabledFlow()
        const body = multipartBody('invoice.paid')

        const response = await app.inject({
            method: 'POST',
            url: `/api/v1/webhooks/${mockFlow.id}`,
            headers: { 'content-type': `multipart/form-data; boundary=${BOUNDARY}` },
            payload: body,
        })

        expect(response.statusCode).toBe(StatusCodes.OK)
        const queued = await readQueuedPayload(mockProject.id)
        expect(queued.rawBody).toBe(body.toString('utf8'))
        expect(sign(Buffer.from(queued.rawBody!, 'utf8'))).toBe(sign(body))
    })

    it('captures rawBody for a binary body', async () => {
        const { mockFlow, mockProject } = await createEnabledFlow()
        const body = Buffer.from('a raw pdf body that is also signed')

        const response = await app.inject({
            method: 'POST',
            url: `/api/v1/webhooks/${mockFlow.id}`,
            headers: { 'content-type': 'application/pdf' },
            payload: body,
        })

        expect(response.statusCode).toBe(StatusCodes.OK)
        const queued = await readQueuedPayload(mockProject.id)
        expect(queued.rawBody).toBe(body.toString('utf8'))
    })

    it('still captures rawBody for JSON', async () => {
        const { mockFlow, mockProject } = await createEnabledFlow()
        const body = JSON.stringify({ event: 'invoice.paid' })

        const response = await app.inject({
            method: 'POST',
            url: `/api/v1/webhooks/${mockFlow.id}`,
            headers: { 'content-type': 'application/json' },
            payload: body,
        })

        expect(response.statusCode).toBe(StatusCodes.OK)
        const queued = await readQueuedPayload(mockProject.id)
        expect(queued.rawBody).toBe(body)
    })

    it('leaves rawBody unset rather than truncated when the body exceeds the capture limit', async () => {
        const { mockFlow, mockProject } = await createEnabledFlow()
        const oversized = multipartBody('x'.repeat(CAPTURE_LIMIT_BYTES + 1024))

        const response = await app.inject({
            method: 'POST',
            url: `/api/v1/webhooks/${mockFlow.id}`,
            headers: { 'content-type': `multipart/form-data; boundary=${BOUNDARY}` },
            payload: oversized,
        })

        expect(response.statusCode).toBe(StatusCodes.OK)
        const queued = await readQueuedPayload(mockProject.id)
        expect(queued.rawBody).toBeUndefined()
    })
})

function multipartBody(value: string): Buffer {
    return Buffer.from(
        `--${BOUNDARY}\r\n`
        + 'Content-Disposition: form-data; name="event"\r\n\r\n'
        + `${value}\r\n`
        + `--${BOUNDARY}--\r\n`,
        'utf8',
    )
}

function sign(body: Buffer): string {
    return createHmac('sha256', SECRET).update(body).digest('hex')
}

async function createEnabledFlow(): Promise<{ mockFlow: Flow, mockProject: Project }> {
    const { mockProject } = await mockAndSaveBasicSetup()
    const mockFlow = createMockFlow({ projectId: mockProject.id, status: FlowStatus.ENABLED })
    await db.save('flow', [mockFlow])
    const mockFlowVersion = createMockFlowVersion({ flowId: mockFlow.id })
    await db.save('flow_version', [mockFlowVersion])
    await db.update('flow', mockFlow.id, { publishedVersionId: mockFlowVersion.id })
    return { mockFlow, mockProject }
}

async function readQueuedPayload(projectId: string): Promise<{ rawBody?: string }> {
    const file = await db.findOneByOrFail<{ data: Buffer }>('file', {
        projectId,
        type: FileType.WEBHOOK_PAYLOAD,
    })
    return JSON.parse(Buffer.from(file.data).toString('utf8'))
}
