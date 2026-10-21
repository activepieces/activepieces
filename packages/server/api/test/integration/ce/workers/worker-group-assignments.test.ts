import { apId } from '@activepieces/core-utils'
import { DefaultProjectRole, FlowStatus, LATEST_JOB_DATA_SCHEMA_VERSION, WorkerGroupScope, WorkerJobType } from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { jobQueue } from '../../../../src/app/workers/job-queue/job-queue'
import { workerGroupQueues } from '../../../../src/app/workers/worker-groups/worker-group-queues'
import { db } from '../../../helpers/db'
import { createMockFlow, createMockFlowVersion, createMockProject } from '../../../helpers/mocks'
import { createMemberContext, createTestContext, TestContext } from '../../../helpers/test-context'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'

let app: FastifyInstance

beforeAll(async () => {
    app = await setupTestEnvironment()
})

afterAll(async () => {
    await teardownTestEnvironment()
})

describe('worker group assignments', () => {
    it('never shows or moves another platform\'s projects and flows', async () => {
        const mine = await createTestContext(app, { plan: { workerGroupsEnabled: true } })
        const theirs = await createTestContext(app, { plan: { workerGroupsEnabled: true } })
        const foreignFlow = await seedFlow({ ctx: theirs, name: 'Shared secret sync' })

        const flows = await mine.get('/v1/worker-groups/assignments/flows', { filter: 'all', search: 'Shared secret' })
        const list = await mine.get('/v1/worker-groups/assignments/projects', { filter: 'all' })
        const moveProjects = await mine.post('/v1/worker-groups/assignments/projects', { projects: [theirs.project.id], workerGroupId: 'gpu' })
        const moveFlows = await mine.post('/v1/worker-groups/assignments/flows', { flows: [foreignFlow.id], workerGroupId: 'gpu' })

        expect(flows.json().data).toEqual([])
        expect(list.json().data.map((p: { id: string }) => p.id)).not.toContain(theirs.project.id)
        expect(moveProjects.statusCode).toBe(StatusCodes.NOT_FOUND)
        expect(moveFlows.statusCode).toBe(StatusCodes.NOT_FOUND)
        expect((await db.findOneByOrFail<{ workerGroupId: string | null }>('project', { id: theirs.project.id })).workerGroupId).toBeNull()
        expect((await db.findOneByOrFail<{ workerGroupId: string | null }>('flow', { id: foreignFlow.id })).workerGroupId).toBeNull()
    })

    it('overview names the first projects and flows on each group, from this platform only', async () => {
        const mine = await createTestContext(app, { plan: { workerGroupsEnabled: true } })
        const theirs = await createTestContext(app, { plan: { workerGroupsEnabled: true } })
        const projectGroup = `eu_${apId().toLowerCase()}`
        const flowGroup = `gpu_${apId().toLowerCase()}`
        await db.save('project', [
            createMockProject({ platformId: mine.platform.id, ownerId: mine.user.id, workerGroupId: projectGroup, displayName: 'Beta' }),
            createMockProject({ platformId: mine.platform.id, ownerId: mine.user.id, workerGroupId: projectGroup, displayName: 'Alpha' }),
            createMockProject({ platformId: theirs.platform.id, ownerId: theirs.user.id, workerGroupId: projectGroup, displayName: 'Aardvark' }),
            createMockProject({ platformId: mine.platform.id, ownerId: mine.user.id, workerGroupId: null, displayName: 'AAA ungrouped' }),
        ])
        await seedFlow({ ctx: mine, name: 'Nightly export', workerGroupId: flowGroup })
        await seedFlow({ ctx: theirs, name: 'A foreign flow', workerGroupId: flowGroup })

        const response = await mine.get('/v1/worker-groups/overview')

        expect(response.statusCode).toBe(StatusCodes.OK)
        const groups = response.json().groups as { label: string }[]
        expect(groups.find((g) => g.label === projectGroup)).toMatchObject({ scope: 'project', projectCount: 2, sample: ['Alpha', 'Beta'] })
        expect(groups.find((g) => g.label === flowGroup)).toMatchObject({ scope: 'flow', flowCount: 1, sample: ['Nightly export'] })
        expect(response.json().defaultGroup.sample[0]).toBe('AAA ungrouped')
    })

    it('overview keeps a project group and a flow group with the same name apart', async () => {
        const ctx = await createTestContext(app, { plan: { workerGroupsEnabled: true } })
        const label = `gpu_${apId().toLowerCase()}`
        const project = createMockProject({ platformId: ctx.platform.id, ownerId: ctx.user.id, workerGroupId: label })
        await db.save('project', project)
        await seedFlow({ ctx, projectId: project.id, name: 'Inherits the project group' })
        await seedFlow({ ctx, projectId: project.id, name: 'Pinned to the flow group', workerGroupId: label })

        const response = await ctx.get('/v1/worker-groups/overview')

        const groups = (response.json().groups as { label: string }[]).filter((g) => g.label === label)
        expect(groups).toEqual([
            expect.objectContaining({ scope: 'flow', projectCount: 0, flowCount: 1, sample: ['Pinned to the flow group'] }),
            expect.objectContaining({ scope: 'project', projectCount: 1, flowCount: 1 }),
        ])
    })

    it('rejects a group name the queues cannot use and changes nothing', async () => {
        const ctx = await createTestContext(app, { plan: { workerGroupsEnabled: true } })

        const response = await ctx.post('/v1/worker-groups/assignments/projects', { projects: [ctx.project.id], workerGroupId: '__none__' })

        expect(response.statusCode).toBe(StatusCodes.CONFLICT)
        expect((await db.findOneByOrFail<{ workerGroupId: string | null }>('project', { id: ctx.project.id })).workerGroupId).toBeNull()
    })

    it.each([
        ['GET', '/v1/worker-groups/overview'],
        ['POST', '/v1/worker-groups/assignments/move-all'],
    ])('%s %s is closed without the plan and to non-admins', async (method, url) => {
        const withoutPlan = await createTestContext(app, { plan: { workerGroupsEnabled: false } })
        const withPlan = await createTestContext(app, { plan: { workerGroupsEnabled: true } })
        const member = await createMemberContext(app, withPlan, { projectRole: DefaultProjectRole.ADMIN })
        const body = { from: 'gpu', to: null, scope: WorkerGroupScope.PROJECT }

        const send = (ctx: TestContext) => method === 'GET' ? ctx.get(url) : ctx.post(url, body)

        expect((await send(withoutPlan)).statusCode).toBe(StatusCodes.PAYMENT_REQUIRED)
        expect((await send(member)).statusCode).toBe(StatusCodes.FORBIDDEN)
    })

    it('move-all with project scope moves the projects and their waiting runs, not the flows pinned to the same name', async () => {
        const ctx = await createTestContext(app, { plan: { workerGroupsEnabled: true } })
        const from = `drain_${apId().toLowerCase()}`
        const to = `spare_${apId().toLowerCase()}`
        const movingProject = createMockProject({ platformId: ctx.platform.id, ownerId: ctx.user.id, workerGroupId: from })
        const stayingProject = createMockProject({ platformId: ctx.platform.id, ownerId: ctx.user.id, workerGroupId: null })
        await db.save('project', [movingProject, stayingProject])
        const pinnedFlow = await seedFlow({ ctx, projectId: stayingProject.id, workerGroupId: from })

        const fromQueue = await jobQueue(app.log).getOrCreateQueue({ queueName: workerGroupQueues.getQueueName({ scope: WorkerGroupScope.PROJECT, workerGroupId: from }) })
        const toQueue = await jobQueue(app.log).getOrCreateQueue({ queueName: workerGroupQueues.getQueueName({ scope: WorkerGroupScope.PROJECT, workerGroupId: to }) })
        await fromQueue.add('moving', buildRunJob({ platformId: ctx.platform.id, projectId: movingProject.id }), { jobId: apId() })
        await fromQueue.add('other-platform', buildRunJob({ platformId: apId(), projectId: apId() }), { jobId: apId() })

        const response = await ctx.post('/v1/worker-groups/assignments/move-all', { from, to, scope: WorkerGroupScope.PROJECT })

        expect(response.statusCode).toBe(StatusCodes.OK)
        expect(response.json()).toMatchObject({ movedWaitingRuns: 1, projects: [movingProject.id], flows: [] })
        expect((await db.findOneByOrFail<{ workerGroupId: string | null }>('project', { id: movingProject.id })).workerGroupId).toBe(to)
        expect((await db.findOneByOrFail<{ workerGroupId: string | null }>('project', { id: stayingProject.id })).workerGroupId).toBeNull()
        expect((await db.findOneByOrFail<{ workerGroupId: string | null }>('flow', { id: pinnedFlow.id })).workerGroupId).toBe(from)
        expect((await toQueue.getJobs(['waiting'])).map((job) => job.name)).toEqual(['moving'])
        expect((await fromQueue.getJobs(['waiting'])).map((job) => job.name)).toEqual(['other-platform'])
        await fromQueue.obliterate({ force: true })
        await toQueue.obliterate({ force: true })
    })

    it('rejects pages above the limit and clamps a cursor past the end to the last page', async () => {
        const ctx = await createTestContext(app, { plan: { workerGroupsEnabled: true } })
        const group = `bulk_${apId().toLowerCase()}`
        const projects = Array.from({ length: 5 }, (_, i) => createMockProject({ platformId: ctx.platform.id, ownerId: ctx.user.id, displayName: `p${i}`, workerGroupId: group }))
        await db.save('project', projects)

        const tooBig = await ctx.get('/v1/worker-groups/assignments/projects', { group, limit: '101' })
        const pastEnd = await ctx.get('/v1/worker-groups/assignments/projects', { group, limit: '2', cursor: '8' })

        expect(tooBig.statusCode).toBe(StatusCodes.BAD_REQUEST)
        expect(pastEnd.json()).toMatchObject({ offset: 4, total: 5, next: null, previous: '2' })
        expect(pastEnd.json().data.map((p: { id: string }) => p.id)).toEqual([projects[4].id])
    })
})

async function seedFlow({ ctx, projectId, name, workerGroupId = null }: { ctx: TestContext, projectId?: string, name?: string, workerGroupId?: string | null }) {
    const flow = createMockFlow({ projectId: projectId ?? ctx.project.id, status: FlowStatus.ENABLED })
    await db.save('flow', { ...flow, workerGroupId })
    await db.save('flow_version', createMockFlowVersion({ flowId: flow.id, displayName: name ?? 'flow' }))
    return flow
}

function buildRunJob({ platformId, projectId }: { platformId: string, projectId: string }) {
    return {
        projectId,
        platformId,
        flowId: apId(),
        schemaVersion: LATEST_JOB_DATA_SCHEMA_VERSION,
        jobType: WorkerJobType.EXECUTE_FLOW,
    }
}
