import { setupTestEnvironment, teardownTestEnvironment } from '../../../../helpers/test-setup'
import { apId } from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { db } from '../../../../helpers/db'
import { createMockFlow, createMockFlowVersion } from '../../../../helpers/mocks'
import { createTestContext } from '../../../../helpers/test-context'

let app: FastifyInstance | null = null

beforeAll(async () => {
    app = await setupTestEnvironment()
})

afterAll(async () => {
    await teardownTestEnvironment()
})

describe('Flow Version API', () => {
    describe('GET /:flowId/versions (List Flow Versions)', () => {
        it('should list versions for a flow', async () => {
            const ctx = await createTestContext(app!)
            const mockFlow = createMockFlow({ projectId: ctx.project.id })
            await db.save('flow', mockFlow)

            const version1 = createMockFlowVersion({ flowId: mockFlow.id })
            const version2 = createMockFlowVersion({ flowId: mockFlow.id })
            await db.save('flow_version', [version1, version2])

            const response = await ctx.get(`/v1/flows/${mockFlow.id}/versions`)
            expect(response.statusCode).toBe(StatusCodes.OK)
            const body = response.json()
            expect(body.data.length).toBe(2)
        })

        it('should paginate versions', async () => {
            const ctx = await createTestContext(app!)
            const mockFlow = createMockFlow({ projectId: ctx.project.id })
            await db.save('flow', mockFlow)

            const versions = Array.from({ length: 3 }, () =>
                createMockFlowVersion({ flowId: mockFlow.id }),
            )
            await db.save('flow_version', versions)

            const response = await ctx.get(`/v1/flows/${mockFlow.id}/versions`, {
                limit: '2',
            })
            expect(response.statusCode).toBe(StatusCodes.OK)
            const body = response.json()
            expect(body.data.length).toBe(2)
            expect(body.next).toBeDefined()
        })

        it('should return 404 for non-existent flow', async () => {
            const ctx = await createTestContext(app!)
            const response = await ctx.get(`/v1/flows/${apId()}/versions`)
            expect(response.statusCode).toBe(StatusCodes.NOT_FOUND)
        })

        it('should not return versions for flow in another project', async () => {
            const ctx1 = await createTestContext(app!)
            const ctx2 = await createTestContext(app!)
            const mockFlow = createMockFlow({ projectId: ctx1.project.id })
            await db.save('flow', mockFlow)
            const version = createMockFlowVersion({ flowId: mockFlow.id })
            await db.save('flow_version', version)

            const response = await ctx2.get(`/v1/flows/${mockFlow.id}/versions`)
            expect(response.statusCode).toBe(StatusCodes.FORBIDDEN)
        })
    })
})
