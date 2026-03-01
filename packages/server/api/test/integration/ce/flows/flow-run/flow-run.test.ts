import { setupTestEnvironment, teardownTestEnvironment } from '../../../../helpers/test-setup'
import {
    apId,
    FlowRetryStrategy,
    FlowRunStatus,
} from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { db } from '../../../../helpers/db'
import {
    createMockFlow,
    createMockFlowRun,
    createMockFlowVersion,
} from '../../../../helpers/mocks'
import { createTestContext } from '../../../../helpers/test-context'

let app: FastifyInstance | null = null

beforeAll(async () => {
    app = await setupTestEnvironment()
})

afterAll(async () => {
    await teardownTestEnvironment()
})

describe('Flow Run API', () => {
    describe('GET /:id (Get Flow Run)', () => {
        it('should return a flow run by id', async () => {
            const ctx = await createTestContext(app!)

            const mockFlow = createMockFlow({ projectId: ctx.project.id })
            await db.save('flow', mockFlow)

            const mockFlowVersion = createMockFlowVersion({ flowId: mockFlow.id })
            await db.save('flow_version', mockFlowVersion)

            const mockFlowRun = createMockFlowRun({
                projectId: ctx.project.id,
                flowId: mockFlow.id,
                flowVersionId: mockFlowVersion.id,
                status: FlowRunStatus.SUCCEEDED,
                logsFileId: null,
            })
            await db.save('flow_run', mockFlowRun)

            const response = await ctx.get(`/v1/flow-runs/${mockFlowRun.id}`)
            expect(response.statusCode).toBe(StatusCodes.OK)
            const body = response.json()
            expect(body.id).toBe(mockFlowRun.id)
            expect(body.projectId).toBe(ctx.project.id)
            expect(body.flowId).toBe(mockFlow.id)
        })

        it('should return 404 for non-existent flow run', async () => {
            const ctx = await createTestContext(app!)
            const response = await ctx.get(`/v1/flow-runs/${apId()}`)
            expect(response.statusCode).toBe(StatusCodes.NOT_FOUND)
        })

        it('should not return flow run from another project', async () => {
            const ctx1 = await createTestContext(app!)
            const ctx2 = await createTestContext(app!)

            const mockFlow = createMockFlow({ projectId: ctx1.project.id })
            await db.save('flow', mockFlow)

            const mockFlowVersion = createMockFlowVersion({ flowId: mockFlow.id })
            await db.save('flow_version', mockFlowVersion)

            const mockFlowRun = createMockFlowRun({
                projectId: ctx1.project.id,
                flowId: mockFlow.id,
                flowVersionId: mockFlowVersion.id,
                logsFileId: null,
            })
            await db.save('flow_run', mockFlowRun)

            const response = await ctx2.get(`/v1/flow-runs/${mockFlowRun.id}`)
            expect(response.statusCode).toBe(StatusCodes.FORBIDDEN)
        })
    })

    describe('POST /archive (Bulk Archive)', () => {
        it('should archive flow runs', async () => {
            const ctx = await createTestContext(app!)

            const mockFlow = createMockFlow({ projectId: ctx.project.id })
            await db.save('flow', mockFlow)

            const mockFlowVersion = createMockFlowVersion({ flowId: mockFlow.id })
            await db.save('flow_version', mockFlowVersion)

            const mockFlowRun = createMockFlowRun({
                projectId: ctx.project.id,
                flowId: mockFlow.id,
                flowVersionId: mockFlowVersion.id,
                status: FlowRunStatus.SUCCEEDED,
                logsFileId: null,
            })
            await db.save('flow_run', mockFlowRun)

            const response = await ctx.post('/v1/flow-runs/archive', {
                projectId: ctx.project.id,
                flowRunIds: [mockFlowRun.id],
            })
            expect(response.statusCode).toBe(StatusCodes.OK)
        })
    })

    describe('POST /cancel (Bulk Cancel)', () => {
        it('should handle cancel with no matching runs', async () => {
            const ctx = await createTestContext(app!)

            const response = await ctx.post('/v1/flow-runs/cancel', {
                projectId: ctx.project.id,
                flowRunIds: [apId()],
            })
            expect(response.statusCode).toBe(StatusCodes.OK)
        })
    })

    describe('POST /retry (Bulk Retry)', () => {
        it('should handle retry with no matching runs', async () => {
            const ctx = await createTestContext(app!)

            const response = await ctx.post('/v1/flow-runs/retry', {
                projectId: ctx.project.id,
                flowRunIds: [apId()],
                strategy: FlowRetryStrategy.ON_LATEST_VERSION,
            })
            expect(response.statusCode).toBe(StatusCodes.OK)
        })
    })
})
