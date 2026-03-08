import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'
import {
    FlowStatus,
    PopulatedFlow,
} from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { createTestContext } from '../../../helpers/test-context'

let app: FastifyInstance | null = null

beforeAll(async () => {
    app = await setupTestEnvironment()
})

afterAll(async () => {
    await teardownTestEnvironment()
})

describe('Trigger Events API', () => {
    describe('POST /v1/trigger-events (Save)', () => {
        it('should save a trigger event', async () => {
            const ctx = await createTestContext(app!)

            const flowResponse = await ctx.post('/v1/flows', {
                displayName: 'trigger event test flow',
                projectId: ctx.project.id,
            }, { query: { projectId: ctx.project.id } })
            const flow: PopulatedFlow = flowResponse?.json()

            const response = await ctx.post('/v1/trigger-events', {
                projectId: ctx.project.id,
                flowId: flow.id,
                mockData: { key: 'value', nested: { a: 1 } },
            })

            expect(response?.statusCode).toBe(StatusCodes.OK)
            const body = response?.json()
            expect(body.flowId).toBe(flow.id)
            expect(body.projectId).toBe(ctx.project.id)
        })
    })

    describe('GET /v1/trigger-events (List)', () => {
        it('should list trigger events', async () => {
            const ctx = await createTestContext(app!)

            const flowResponse = await ctx.post('/v1/flows', {
                displayName: 'list trigger events flow',
                projectId: ctx.project.id,
            }, { query: { projectId: ctx.project.id } })
            const flow: PopulatedFlow = flowResponse?.json()

            await ctx.post('/v1/trigger-events', {
                flowId: flow.id,
                projectId: ctx.project.id,
                mockData: { event: 'one' },
            })
            await ctx.post('/v1/trigger-events', {
                projectId: ctx.project.id,
                flowId: flow.id,
                mockData: { event: 'two' },
            })

            const response = await ctx.get('/v1/trigger-events', {
                projectId: ctx.project.id,
                flowId: flow.id,
            })

            expect(response?.statusCode).toBe(StatusCodes.OK)
            const body = response?.json()
            expect(body.data.length).toBeGreaterThanOrEqual(2)
        })

        it('should return empty for flow with no events', async () => {
            const ctx = await createTestContext(app!)

            const flowResponse = await ctx.post('/v1/flows', {
                displayName: 'empty trigger events flow',
                projectId: ctx.project.id,
            }, { query: { projectId: ctx.project.id } })
            const flow: PopulatedFlow = flowResponse?.json()

            const response = await ctx.get('/v1/trigger-events', {
                projectId: ctx.project.id,
                flowId: flow.id,
            })

            expect(response?.statusCode).toBe(StatusCodes.OK)
            const body = response?.json()
            expect(body.data).toHaveLength(0)
        })

        it('should respect limit parameter', async () => {
            const ctx = await createTestContext(app!)

            const flowResponse = await ctx.post('/v1/flows', {
                displayName: 'paginate trigger events flow',
                projectId: ctx.project.id,
            }, { query: { projectId: ctx.project.id } })
            const flow: PopulatedFlow = flowResponse?.json()

            await ctx.post('/v1/trigger-events', { projectId: ctx.project.id, flowId: flow.id, mockData: { n: 1 } })
            await ctx.post('/v1/trigger-events', { projectId: ctx.project.id, flowId: flow.id, mockData: { n: 2 } })
            await ctx.post('/v1/trigger-events', { projectId: ctx.project.id, flowId: flow.id, mockData: { n: 3 } })

            const response = await ctx.get('/v1/trigger-events', {
                projectId: ctx.project.id,
                flowId: flow.id,
                limit: '2',
            })

            expect(response?.statusCode).toBe(StatusCodes.OK)
            const body = response?.json()
            expect(body.data).toHaveLength(2)
        })
    })

    describe('Cross-project isolation', () => {
        it('should not allow saving events for another project flow', async () => {
            const ctx1 = await createTestContext(app!)
            const ctx2 = await createTestContext(app!)

            const flowResponse = await ctx1.post('/v1/flows', {
                displayName: 'cross project flow',
                projectId: ctx1.project.id,
            }, { query: { projectId: ctx1.project.id } })
            const flow: PopulatedFlow = flowResponse?.json()

            const response = await ctx2.post('/v1/trigger-events', {
                projectId: ctx2.project.id,
                flowId: flow.id,
                mockData: { unauthorized: true },
            })

            expect(response?.statusCode).toBe(StatusCodes.NOT_FOUND)
        })
    })
})
