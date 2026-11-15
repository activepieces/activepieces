import { FlowRunStatus, FlowVersionState, RunEnvironment } from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { flowRunService } from '../../../../../src/app/flows/flow-run/flow-run-service'
import { db } from '../../../../helpers/db'
import { describeWithAuth } from '../../../../helpers/describe-with-auth'
import { createMockFlow, createMockFlowRun, createMockFlowVersion } from '../../../../helpers/mocks'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../../helpers/test-setup'

let app: FastifyInstance | null = null

beforeAll(async () => {
    app = await setupTestEnvironment()
})

afterAll(async () => {
    await teardownTestEnvironment()
})

async function createProductionRun(projectId: string) {
    const flow = createMockFlow({ projectId })
    await db.save('flow', flow)

    const flowVersion = createMockFlowVersion({
        flowId: flow.id,
        state: FlowVersionState.LOCKED,
    })
    await db.save('flow_version', flowVersion)

    const flowRun = createMockFlowRun({
        projectId,
        flowId: flow.id,
        flowVersionId: flowVersion.id,
        status: FlowRunStatus.SUCCEEDED,
        environment: RunEnvironment.PRODUCTION,
    })
    await db.save('flow_run', flowRun)

    return { flow, flowVersion, flowRun }
}

describeWithAuth('List flow runs endpoint', () => app!, (setup) => {
    it('should return empty list with correct structure', async () => {
        const ctx = await setup()

        const response = await ctx.get('/v1/flow-runs', {
            projectId: ctx.project.id,
        })

        expect(response?.statusCode).toBe(200)
        const body = response?.json()
        expect(body.data).toEqual([])
        expect(body.cursor).toBeUndefined()
    })

    it('should return the flow version display name', async () => {
        const ctx = await setup()
        const { flowVersion } = await createProductionRun(ctx.project.id)

        const response = await ctx.get('/v1/flow-runs', {
            projectId: ctx.project.id,
        })

        expect(response?.statusCode).toBe(200)
        const body = response?.json()
        expect(body.data).toHaveLength(1)
        expect(body.data[0].flowVersion.displayName).toBe(flowVersion.displayName)
    })

    it('should not read the flow definition into listed runs', async () => {
        const ctx = await setup()
        const { flowVersion } = await createProductionRun(ctx.project.id)

        const { data } = await flowRunService(app!.log).list({
            projectId: ctx.project.id,
            flowId: undefined,
            status: undefined,
            cursor: null,
            limit: 10,
            environment: RunEnvironment.PRODUCTION,
        })

        expect(data).toHaveLength(1)
        expect(data[0].flowVersion?.displayName).toBe(flowVersion.displayName)
        expect(data[0].flowVersion).not.toHaveProperty('trigger')
        expect(data[0].flowVersion).not.toHaveProperty('notes')
        expect(data[0].flowVersion).not.toHaveProperty('backupFiles')
        expect(data[0]).not.toHaveProperty('flowVersion_trigger')
    })
})
