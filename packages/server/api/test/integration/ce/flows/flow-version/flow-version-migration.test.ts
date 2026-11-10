import { FlowVersion, FlowVersionState, LATEST_FLOW_SCHEMA_VERSION } from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
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

async function saveDraftVersion(ctx: TestContext, schemaVersion: string): Promise<FlowVersion> {
    const mockFlow = createMockFlow({ projectId: ctx.project.id })
    await db.save('flow', mockFlow)
    const mockVersion = createMockFlowVersion({ flowId: mockFlow.id, state: FlowVersionState.DRAFT, schemaVersion })
    await db.save('flow_version', mockVersion)
    return mockVersion
}

describe('flowVersionMigrationService.migrate', () => {
    it('persists the upgrade when nothing else wrote the row', async () => {
        const ctx = await createTestContext(app!)
        const staleVersion = await saveDraftVersion(ctx, '20')

        await flowVersionMigrationService(app!.log).migrate(staleVersion, ctx.project.id)

        const persisted = await db.findOneByOrFail<FlowVersion>('flow_version', { id: staleVersion.id })
        expect(persisted.schemaVersion).toBe(LATEST_FLOW_SCHEMA_VERSION)
    })

    it('does not overwrite a row that was written after it was read', async () => {
        const ctx = await createTestContext(app!)
        const staleVersion = await saveDraftVersion(ctx, '20')
        const editedTrigger = { ...staleVersion.trigger, displayName: 'user-edit' }
        await db.update('flow_version', staleVersion.id, { schemaVersion: LATEST_FLOW_SCHEMA_VERSION, trigger: editedTrigger })

        const result = await flowVersionMigrationService(app!.log).migrate(staleVersion, ctx.project.id)

        const persisted = await db.findOneByOrFail<FlowVersion>('flow_version', { id: staleVersion.id })
        expect(persisted.trigger.displayName).toBe('user-edit')
        expect(result.schemaVersion).toBe(LATEST_FLOW_SCHEMA_VERSION)
    })
})
