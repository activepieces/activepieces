import {
    FlowActionType,
    FlowOperationType,
    FlowStatus,
    FlowVersion,
    FlowVersionState,
    LATEST_FLOW_SCHEMA_VERSION,
} from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { flowVersionMigrationService } from '../../../../../src/app/flows/flow-version/flow-version-migration.service'
import { db } from '../../../../helpers/db'
import { createMockFlow, createMockFlowVersion } from '../../../../helpers/mocks'
import { createTestContext, TestContext } from '../../../../helpers/test-context'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../../helpers/test-setup'

let app: FastifyInstance | null = null

beforeAll(async () => {
    app = await setupTestEnvironment()
})

afterAll(async () => {
    await teardownTestEnvironment()
})

describe('Schema migration on read', () => {
    it('migrates a draft with an older schema version and keeps its updated value', async () => {
        const ctx = await createTestContext(app!)
        const draft = await seedDraftWithOlderSchema(ctx)
        const beforeMigration = await db.findOneByOrFail<FlowVersion>('flow_version', { id: draft.id })

        const migrated = await flowVersionMigrationService(app!.log).migrate(beforeMigration, ctx.project.id)

        const stored = await db.findOneByOrFail<FlowVersion>('flow_version', { id: draft.id })
        expect(migrated.schemaVersion).toBe(LATEST_FLOW_SCHEMA_VERSION)
        expect(stored.schemaVersion).toBe(LATEST_FLOW_SCHEMA_VERSION)
        expect(new Date(stored.updated).toISOString()).toBe(new Date(beforeMigration.updated).toISOString())
    })

    it('never puts back older content over a save that lands between the read and the write-back', async () => {
        const ctx = await createTestContext(app!)
        const draft = await seedDraftWithOlderSchema(ctx)
        const staleRead = await db.findOneByOrFail<FlowVersion>('flow_version', { id: draft.id })

        const saveResponse = await ctx.post(`/v1/flows/${draft.flowId}`, {
            type: FlowOperationType.ADD_ACTION,
            request: {
                parentStep: 'trigger',
                action: {
                    type: FlowActionType.CODE,
                    displayName: 'Code Step',
                    name: 'step_1',
                    settings: {
                        input: {},
                        sourceCode: {
                            code: 'export const code = async () => { return true; }',
                            packageJson: '{}',
                        },
                    },
                    valid: true,
                    skip: false,
                },
            },
        })
        expect(saveResponse?.statusCode).toBe(StatusCodes.OK)
        const afterSave = await db.findOneByOrFail<FlowVersion>('flow_version', { id: draft.id })

        await flowVersionMigrationService(app!.log).migrate(staleRead, ctx.project.id)

        const stored = await db.findOneByOrFail<FlowVersion>('flow_version', { id: draft.id })
        expect(stored.trigger.nextAction?.name).toBe('step_1')
        expect(stored.schemaVersion).toBe(LATEST_FLOW_SCHEMA_VERSION)
        expect(new Date(stored.updated).toISOString()).toBe(new Date(afterSave.updated).toISOString())
    })
})

async function seedDraftWithOlderSchema(ctx: TestContext): Promise<FlowVersion> {
    const flow = createMockFlow({ projectId: ctx.project.id, status: FlowStatus.DISABLED })
    await db.save('flow', flow)
    const draft = createMockFlowVersion({
        flowId: flow.id,
        state: FlowVersionState.DRAFT,
        schemaVersion: OLDER_SCHEMA_VERSION,
        updated: '2026-01-01T00:00:00.000Z',
    })
    await db.save('flow_version', draft)
    return draft
}

const OLDER_SCHEMA_VERSION = '27'
