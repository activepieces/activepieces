import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'
import { FlowStatus } from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { db } from '../../../helpers/db'
import { createMockFlow, createMockFlowVersion, mockAndSaveBasicSetup } from '../../../helpers/mocks'

let app: FastifyInstance | null = null

beforeAll(async () => {
    app = await setupTestEnvironment()
})

afterAll(async () => {
    await teardownTestEnvironment()
})

async function createEnabledFlow() {
    const { mockProject } = await mockAndSaveBasicSetup()
    const mockFlow = createMockFlow({
        projectId: mockProject.id,
        status: FlowStatus.ENABLED,
    })
    await db.save('flow', [mockFlow])
    const mockFlowVersion = createMockFlowVersion({ flowId: mockFlow.id })
    await db.save('flow_version', [mockFlowVersion])
    await db.update('flow', mockFlow.id, { publishedVersionId: mockFlowVersion.id })
    return mockFlow
}

describe('Webhook XML body parsing', () => {
    it('should accept application/xml content type', async () => {
        const flow = await createEnabledFlow()
        const response = await app!.inject({
            method: 'POST',
            url: `/api/v1/webhooks/${flow.id}`,
            headers: { 'content-type': 'application/xml' },
            payload: '<root><item>hello</item></root>',
        })
        expect(response.statusCode).toBe(StatusCodes.OK)
    })

    it('should accept text/xml content type', async () => {
        const flow = await createEnabledFlow()
        const response = await app!.inject({
            method: 'POST',
            url: `/api/v1/webhooks/${flow.id}`,
            headers: { 'content-type': 'text/xml' },
            payload: '<root><item>hello</item></root>',
        })
        expect(response.statusCode).toBe(StatusCodes.OK)
    })

    it('should accept application/rss+xml content type', async () => {
        const flow = await createEnabledFlow()
        const response = await app!.inject({
            method: 'POST',
            url: `/api/v1/webhooks/${flow.id}`,
            headers: { 'content-type': 'application/rss+xml' },
            payload: '<rss version="2.0"><channel><title>Feed</title></channel></rss>',
        })
        expect(response.statusCode).toBe(StatusCodes.OK)
    })

    // fast-xml-parser is intentionally lenient and does not throw on structural
    // issues like unclosed tags, so we only assert the server does not crash.
    it('should not crash on structurally invalid XML', async () => {
        const flow = await createEnabledFlow()
        const response = await app!.inject({
            method: 'POST',
            url: `/api/v1/webhooks/${flow.id}`,
            headers: { 'content-type': 'application/xml' },
            payload: '<unclosed>',
        })
        expect(response.statusCode).not.toBe(StatusCodes.INTERNAL_SERVER_ERROR)
    })

    // The server must survive entity injection payloads without a 500 crash.
    // Body-level entity override isolation is covered by the unit test in
    // test/unit/app/webhooks/webhook-xml-parser.test.ts.
    it('should not crash on DOCTYPE entity injection', async () => {
        const flow = await createEnabledFlow()
        const maliciousXml = [
            '<?xml version="1.0"?>',
            '<!DOCTYPE x [',
            '  <!ENTITY lt "INJECTED">',
            ']>',
            '<root><item>&lt;script&gt;alert(1)&lt;/script&gt;</item></root>',
        ].join('\n')

        const response = await app!.inject({
            method: 'POST',
            url: `/api/v1/webhooks/${flow.id}`,
            headers: { 'content-type': 'application/xml' },
            payload: maliciousXml,
        })
        expect(response.statusCode).not.toBe(StatusCodes.INTERNAL_SERVER_ERROR)
    })
})
