import { apId } from '@activepieces/core-utils'
import { FlowRunStatus, FlowVersionState, RunEnvironment } from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { vi } from 'vitest'
import { databaseConnection } from '../../../../src/app/database/database-connection'
import { billingUsageReportService } from '../../../../src/app/ee/billing-usage-report/billing-usage-report-service'
import { db } from '../../../helpers/db'
import { createMockFlow, createMockFlowRun, createMockFlowVersion } from '../../../helpers/mocks'
import { createTestContext, TestContext } from '../../../helpers/test-context'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'

const { mockCaptureBillingEvent } = vi.hoisted(() => ({ mockCaptureBillingEvent: vi.fn() }))

vi.mock('../../../../src/app/helper/telemetry.utils', async (importOriginal) => {
    const original = await importOriginal<typeof import('../../../../src/app/helper/telemetry.utils')>()
    return {
        ...original,
        captureBillingEvent: mockCaptureBillingEvent,
        flushBillingEvents: vi.fn().mockResolvedValue(undefined),
    }
})

vi.mock('../../../../src/app/helper/sleep', () => ({
    sleep: vi.fn().mockResolvedValue(undefined),
}))

let app: FastifyInstance
let ctx: TestContext

beforeAll(async () => {
    app = await setupTestEnvironment({ fresh: true })
})

afterAll(async () => {
    await teardownTestEnvironment()
})

beforeEach(async () => {
    ctx = await createTestContext(app)
    mockCaptureBillingEvent.mockClear()
})

function yesterdayNoonUtc(): Date {
    const date = new Date()
    date.setUTCDate(date.getUTCDate() - 1)
    date.setUTCHours(12, 0, 0, 0)
    return date
}

describe('Daily platform execution tracking', () => {
    it('excludes barrier children from the reported daily execution count', async () => {
        const flow = createMockFlow({ projectId: ctx.project.id })
        await db.save('flow', flow)
        const flowVersion = createMockFlowVersion({ flowId: flow.id, state: FlowVersionState.LOCKED })
        await db.save('flow_version', flowVersion)

        const runDay = yesterdayNoonUtc()
        const barrierId = apId()
        const runs = [undefined, barrierId, barrierId, barrierId].map((parentWaitpointId, index) => ({
            ...createMockFlowRun({
                projectId: ctx.project.id,
                flowId: flow.id,
                flowVersionId: flowVersion.id,
                status: FlowRunStatus.SUCCEEDED,
                environment: RunEnvironment.PRODUCTION,
                parentWaitpointId,
            }),
            dispatchIndex: index === 0 ? null : index - 1,
        }))
        for (const run of runs) {
            await db.save('flow_run', run)
            await databaseConnection().query('UPDATE flow_run SET created = $1 WHERE id = $2', [runDay.toISOString(), run.id])
        }

        await billingUsageReportService(app.log).reportAllPlatforms()

        const reported = mockCaptureBillingEvent.mock.calls
            .map(([event]): CapturedBillingEvent => event)
            .find((event) => event.properties.platform_id === ctx.platform.id)

        expect(reported?.properties.daily_executions).toEqual([
            { date: runDay.toISOString().slice(0, 10), count: 1 },
        ])
    })
})

type CapturedBillingEvent = {
    properties: {
        platform_id: string
        daily_executions: { date: string, count: number }[]
    }
}
