import { apId } from '@activepieces/core-utils'
import { FlowRunStatus, FlowVersionState, RunEnvironment } from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { vi } from 'vitest'
import { databaseConnection } from '../../../../src/app/database/database-connection'
import { licenseKeyUsageReportService } from '../../../../src/app/ee/license-key-usage-report/license-key-usage-report-service'
import { db } from '../../../helpers/db'
import { createMockFlow, createMockFlowRun, createMockFlowVersion } from '../../../helpers/mocks'
import { createTestContext, TestContext } from '../../../helpers/test-context'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'

const { mockCaptureLicenseKeyEvent } = vi.hoisted(() => ({ mockCaptureLicenseKeyEvent: vi.fn() }))

vi.mock('../../../../src/app/helper/telemetry.utils', async (importOriginal) => {
    const original = await importOriginal<typeof import('../../../../src/app/helper/telemetry.utils')>()
    return {
        ...original,
        captureLicenseKeyEvent: mockCaptureLicenseKeyEvent,
        flushLicenseKeyPostHogEvents: vi.fn().mockResolvedValue(undefined),
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
    mockCaptureLicenseKeyEvent.mockClear()
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

        await licenseKeyUsageReportService(app.log).reportAllPlatforms()

        const reported = mockCaptureLicenseKeyEvent.mock.calls
            .map(([event]): CapturedLicenseKeyEvent => event)
            .find((event) => event.properties.platform_id === ctx.platform.id)

        expect(reported?.properties.daily_executions).toEqual([
            { date: runDay.toISOString().slice(0, 10), count: 1 },
        ])
    })
})

type CapturedLicenseKeyEvent = {
    properties: {
        platform_id: string
        daily_executions: { date: string, count: number }[]
    }
}
