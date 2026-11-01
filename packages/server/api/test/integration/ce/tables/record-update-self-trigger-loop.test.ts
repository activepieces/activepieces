import { tryCatch } from '@activepieces/core-utils'
import { FieldType, TableWebhookEventType } from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { webhookService } from '../../../../src/app/webhooks/webhook.service'
import { db } from '../../../helpers/db'
import { createMockCell, createMockField, createMockFlow, createMockRecord, createMockTable } from '../../../helpers/mocks'
import { createTestContext, TestContext } from '../../../helpers/test-context'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'

let app: FastifyInstance | null = null

beforeAll(async () => {
    app = await setupTestEnvironment({ fresh: true })
})

afterAll(async () => {
    await teardownTestEnvironment()
})

describe('A Record Updated flow that marks its own record as processed', () => {
    it('stops triggering itself instead of looping on its own write', async () => {
        const handleWebhook = vi.spyOn(webhookService, 'handleWebhook').mockResolvedValue({ status: StatusCodes.OK, body: {}, headers: {} })
        const ctx = await createTestContext(app!)
        const { table, field } = await createTableWithField(ctx)
        const record = await saveRecordWithValue({ ctx, tableId: table.id, fieldId: field.id, value: 'new' })
        const flow = await subscribeFlow({ ctx, tableId: table.id })
        const runsStartedForFlow = (): number => handleWebhook.mock.calls.filter(([params]) => params.flowId === flow.id).length
        const updateRecordStepOfTheFlow = () => ctx.post(`/v1/records/${record.id}`, {
            tableId: table.id,
            cells: [{ fieldId: field.id, value: 'processed' }],
        })

        const oneExternalEdit = await ctx.post(`/v1/records/${record.id}`, {
            tableId: table.id,
            cells: [{ fieldId: field.id, value: 'edited by a person' }],
        })
        const runs = await runTheFlowForEveryEvent({ runsStartedForFlow, runFlow: updateRecordStepOfTheFlow })

        expect(oneExternalEdit?.statusCode).toBe(StatusCodes.OK)
        expect(runs).toBe(2)
    })
})

async function runTheFlowForEveryEvent({ runsStartedForFlow, runFlow }: { runsStartedForFlow: () => number, runFlow: () => Promise<unknown> }): Promise<number> {
    for (let runs = 0; runs < MAX_RUNS; runs++) {
        const { error: noNewEvent } = await tryCatch(() => vi.waitFor(() => {
            expect(runsStartedForFlow()).toBeGreaterThan(runs)
        }, { timeout: QUIET_MS, interval: 5 }))
        if (noNewEvent) {
            return runs
        }
        await runFlow()
    }
    return MAX_RUNS
}

async function createTableWithField(ctx: TestContext) {
    const table = createMockTable({ projectId: ctx.project.id })
    await db.save('table', table)
    const field = createMockField({ tableId: table.id, projectId: ctx.project.id })
    field.type = FieldType.TEXT
    await db.save('field', field)
    return { table, field }
}

async function saveRecordWithValue({ ctx, tableId, fieldId, value }: { ctx: TestContext, tableId: string, fieldId: string, value: string }) {
    const record = createMockRecord({ tableId, projectId: ctx.project.id })
    await db.save('record', record)
    const cell = createMockCell({ recordId: record.id, fieldId, projectId: ctx.project.id })
    cell.value = value
    await db.save('cell', cell)
    return record
}

async function subscribeFlow({ ctx, tableId }: { ctx: TestContext, tableId: string }) {
    const flow = createMockFlow({ projectId: ctx.project.id })
    await db.save('flow', flow)
    const response = await ctx.post(`/v1/tables/${tableId}/webhooks`, {
        events: [TableWebhookEventType.RECORD_UPDATED],
        webhookUrl: `http://localhost:4200/api/v1/webhooks/${flow.id}`,
        flowId: flow.id,
    })
    expect(response?.statusCode).toBe(StatusCodes.OK)
    return flow
}

const MAX_RUNS = 200
const QUIET_MS = 1000
