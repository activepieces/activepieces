import {
    EngineResponseStatus,
    File,
    FileType,
    PopulatedFlow,
    TriggerEvent,
    TriggerTestStrategy,
} from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { userInteractionWatcher } from '../../../../src/app/workers/user-interaction-watcher'
import { db } from '../../../helpers/db'
import { seedPublishableFlow } from '../../../helpers/mcp-flow'
import { createTestContext, TestContext } from '../../../helpers/test-context'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'

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

    describe('POST /v1/test-trigger (TEST_FUNCTION)', () => {
        it('should delete the files of the test events it replaces', async () => {
            const engineSpy = vi.spyOn(userInteractionWatcher, 'submitAndWaitForResponse').mockResolvedValue({
                status: EngineResponseStatus.OK,
                response: { output: [{ file: 'a.csv' }, { file: 'b.csv' }, { file: 'c.csv' }] },
            })
            const ctx = await createTestContext(app!)
            const otherCtx = await createTestContext(app!)
            const { flow, flowVersion } = await seedPublishableFlow({ ctx })
            const other = await seedPublishableFlow({ ctx: otherCtx })

            const responses = [
                await testTriggerFunction({ ctx: otherCtx, flowId: other.flow.id, flowVersionId: other.flowVersion.id }),
                await testTriggerFunction({ ctx, flowId: flow.id, flowVersionId: flowVersion.id }),
                await testTriggerFunction({ ctx, flowId: flow.id, flowVersionId: flowVersion.id }),
                await testTriggerFunction({ ctx, flowId: flow.id, flowVersionId: flowVersion.id }),
            ]
            engineSpy.mockRestore()

            expect(responses.map((response) => response?.statusCode)).toEqual(Array(4).fill(StatusCodes.OK))
            const events = await db.findBy<TriggerEvent>('trigger_event', { projectId: ctx.project.id, flowId: flow.id })
            const files = await db.findBy<File>('file', { projectId: ctx.project.id, type: FileType.TRIGGER_EVENT_FILE })
            const otherFiles = await db.findBy<File>('file', { projectId: otherCtx.project.id, type: FileType.TRIGGER_EVENT_FILE })
            expect(events).toHaveLength(3)
            expect(files.map((file) => file.id).sort()).toEqual(events.map((event) => event.fileId).sort())
            expect(otherFiles).toHaveLength(3)
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

function testTriggerFunction({ ctx, flowId, flowVersionId }: { ctx: TestContext, flowId: string, flowVersionId: string }) {
    return ctx.post('/v1/test-trigger', {
        projectId: ctx.project.id,
        flowId,
        flowVersionId,
        testStrategy: TriggerTestStrategy.TEST_FUNCTION,
    })
}
