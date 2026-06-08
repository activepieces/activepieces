import {
    FlowActionType,
    FlowTriggerType,
    FlowVersion,
    FlowVersionState,
    LATEST_FLOW_SCHEMA_VERSION,
} from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { databaseConnection } from '../../../../src/app/database/database-connection'
import { flowVersionOutputRepairService } from '../../../../src/app/flows/flow-version/flow-version-output-repair.service'
import { db } from '../../../helpers/db'
import { createMockFlow, createMockFlowVersion, mockAndSaveBasicSetup } from '../../../helpers/mocks'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'

let app: FastifyInstance | null = null

beforeAll(async () => {
    app = await setupTestEnvironment()
})

afterAll(async () => {
    await teardownTestEnvironment()
})

function corruptedTrigger(): FlowVersion['trigger'] {
    return {
        name: 'trigger',
        type: FlowTriggerType.PIECE,
        valid: true,
        displayName: 'Catch Webhook',
        settings: {
            pieceName: '@activepieces/piece-webhook',
            pieceVersion: '0.1.26',
            triggerName: 'catch_webhook',
            input: { authType: 'none', authFields: {} },
        },
        nextAction: {
            name: 'step_1',
            type: FlowActionType.PIECE,
            valid: true,
            displayName: 'Insert Row',
            settings: {
                pieceName: '@activepieces/piece-google-sheets',
                pieceVersion: '0.10.13',
                actionName: 'insert_row',
                input: {
                    bank: "{{trigger['output']['output']['body']['senderName']}}",
                    amount: "{{step_1['output']['output']['amount']}}",
                },
            },
        },
    } as unknown as FlowVersion['trigger']
}

describe('Flow Version Output Repair', () => {
    it('repairs the newest version even when its created timestamp has sub-millisecond precision', async () => {
        const { mockProject } = await mockAndSaveBasicSetup()
        const flow = createMockFlow({ projectId: mockProject.id })
        await db.save('flow', flow)

        const publishedVersion = createMockFlowVersion({
            flowId: flow.id,
            schemaVersion: LATEST_FLOW_SCHEMA_VERSION,
            state: FlowVersionState.LOCKED,
            backupFiles: { '21': 'published-backup' },
        })
        const draftVersion = createMockFlowVersion({
            flowId: flow.id,
            schemaVersion: LATEST_FLOW_SCHEMA_VERSION,
            state: FlowVersionState.DRAFT,
            backupFiles: { '21': 'draft-backup' },
            trigger: corruptedTrigger(),
        })
        await db.save('flow_version', [publishedVersion, draftVersion])

        // Force the DB to hold microsecond precision so the JS millisecond-truncated
        // value (the original bug) would have excluded the draft from its own lineage.
        await databaseConnection().query(
            'UPDATE flow_version SET created = $1 WHERE id = $2',
            ['2026-01-22 22:29:40.000000+00', publishedVersion.id],
        )
        await databaseConnection().query(
            'UPDATE flow_version SET created = $1 WHERE id = $2',
            ['2026-06-07 11:38:53.229771+00', draftVersion.id],
        )

        const result = await flowVersionOutputRepairService(app!.log).repairOutputNesting(draftVersion.id)

        expect(result.alreadyRepaired).toBe(false)
        expect(result.erroneousLevels).toBe(1)
        expect(result.stepsChanged).toBe(1)

        const repaired = await db.findOneByOrFail<FlowVersion>('flow_version', { id: draftVersion.id })
        const repairedAction = repaired.trigger.nextAction
        expect(repairedAction?.settings.input).toEqual({
            bank: "{{trigger['output']['body']['senderName']}}",
            amount: "{{step_1['output']['amount']}}",
        })
    })

    it('is a no-op when the lineage has no extra migrations', async () => {
        const { mockProject } = await mockAndSaveBasicSetup()
        const flow = createMockFlow({ projectId: mockProject.id })
        await db.save('flow', flow)

        const onlyVersion = createMockFlowVersion({
            flowId: flow.id,
            schemaVersion: LATEST_FLOW_SCHEMA_VERSION,
            state: FlowVersionState.DRAFT,
            backupFiles: { '21': 'only-backup' },
            trigger: corruptedTrigger(),
        })
        await db.save('flow_version', onlyVersion)

        const result = await flowVersionOutputRepairService(app!.log).repairOutputNesting(onlyVersion.id)

        expect(result.erroneousLevels).toBe(0)
        expect(result.stepsChanged).toBe(0)
    })
})
