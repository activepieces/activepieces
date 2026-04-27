import {
    FlowActionType,
    FlowStatus,
    FlowTriggerType,
    FlowVersion,
    FlowVersionState,
} from '@activepieces/shared'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockSave = vi.fn()
const mockFlowFindOne = vi.fn()

vi.mock('../../../../../../src/app/file/file.service', () => ({
    fileService: () => ({
        save: mockSave,
    }),
}))

vi.mock('../../../../../../src/app/flows/flow/flow.repo', () => ({
    flowRepo: () => ({
        findOne: mockFlowFindOne,
    }),
}))

import { migrateV20SubflowsSampleData } from '../../../../../../src/app/flows/flow-version/migrations/migrate-v20-subflows-sample-data'

const SUBFLOWS_PIECE = '@activepieces/piece-subflows'

const mockLogger = {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    child: vi.fn(),
} as never

const baseFlowVersion = (trigger: FlowVersion['trigger']): FlowVersion => ({
    id: 'fv-1',
    flowId: 'f-1',
    displayName: 'My Flow',
    state: FlowVersionState.DRAFT,
    schemaVersion: '20',
    valid: true,
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
    updatedBy: 'u-1',
    notes: [],
    connectionIds: [],
    agentIds: [],
    trigger,
})

const callableFlowTrigger = (extras: Record<string, unknown> = {}) => ({
    type: FlowTriggerType.PIECE,
    name: 'trigger',
    displayName: 'When Called by Another Flow',
    valid: true,
    lastUpdatedDate: new Date().toISOString(),
    settings: {
        pieceName: SUBFLOWS_PIECE,
        pieceVersion: '0.4.14',
        triggerName: 'callableFlow',
        propertySettings: {},
        input: {},
        ...extras,
    },
    nextAction: undefined,
}) as unknown as FlowVersion['trigger']

const callFlowAction = (input: Record<string, unknown>) => ({
    type: FlowActionType.PIECE,
    name: 'step_1',
    displayName: 'Call Another Flow',
    valid: true,
    lastUpdatedDate: new Date().toISOString(),
    skip: false,
    settings: {
        pieceName: SUBFLOWS_PIECE,
        pieceVersion: '0.4.14',
        actionName: 'callFlow',
        propertySettings: {},
        input,
    },
    nextAction: undefined,
})

const SAVED_FILE_ID = 'file-xyz'

beforeEach(() => {
    vi.clearAllMocks()
    mockSave.mockResolvedValue({ id: SAVED_FILE_ID })
    mockFlowFindOne.mockResolvedValue(null)
})

describe('migrateV20SubflowsSampleData', () => {
    it('bumps schemaVersion to 21', async () => {
        const trigger = callableFlowTrigger()
        const result = await migrateV20SubflowsSampleData.migrate(
            baseFlowVersion(trigger),
            { log: mockLogger, projectId: 'p-1' },
        )
        expect(result.schemaVersion).toBe('21')
    })

    describe('callable-flow trigger', () => {
        it('writes legacy exampleData to a sample-data file and links its id', async () => {
            const sample = { name: 'ada', age: 36 }
            const trigger = callableFlowTrigger({
                input: {
                    mode: 'simple',
                    exampleData: { sampleData: sample },
                },
            })
            const result = await migrateV20SubflowsSampleData.migrate(
                baseFlowVersion(trigger),
                { log: mockLogger, projectId: 'p-1' },
            )
            expect(mockSave).toHaveBeenCalledTimes(1)
            const saveArgs = mockSave.mock.calls[0][0]
            expect(saveArgs.projectId).toBe('p-1')
            expect(saveArgs.metadata).toMatchObject({
                flowId: 'f-1',
                flowVersionId: 'fv-1',
                stepName: 'trigger',
            })
            expect(JSON.parse(saveArgs.data.toString('utf-8'))).toEqual(sample)

            const migratedTrigger = result.trigger
            expect(migratedTrigger.settings.sampleData?.sampleDataFileId).toBe(SAVED_FILE_ID)
            expect(migratedTrigger.settings.sampleData?.lastTestDate).toBeDefined()
            expect(migratedTrigger.settings.input).toEqual({})
        })

        it('is idempotent when sampleDataFileId already exists', async () => {
            const trigger = callableFlowTrigger({
                input: { mode: 'simple', exampleData: { sampleData: { x: 1 } } },
                sampleData: { sampleDataFileId: 'existing-file', lastTestDate: '2026-01-01T00:00:00Z' },
            })
            const result = await migrateV20SubflowsSampleData.migrate(
                baseFlowVersion(trigger),
                { log: mockLogger, projectId: 'p-1' },
            )
            expect(mockSave).not.toHaveBeenCalled()
            expect(result.trigger.settings.sampleData?.sampleDataFileId).toBe('existing-file')
            // legacy keys still cleaned up
            expect(result.trigger.settings.input).toEqual({})
        })

        it('skips file creation when legacy sampleData is missing', async () => {
            const trigger = callableFlowTrigger({ input: { mode: 'simple' } })
            const result = await migrateV20SubflowsSampleData.migrate(
                baseFlowVersion(trigger),
                { log: mockLogger, projectId: 'p-1' },
            )
            expect(mockSave).not.toHaveBeenCalled()
            expect(result.trigger.settings.sampleData?.sampleDataFileId).toBeUndefined()
            expect(result.trigger.settings.input).toEqual({})
        })

        it('skips file creation when legacy sampleData is not a plain object', async () => {
            for (const sampleData of ['hello', null, ['x'], 42] as const) {
                vi.clearAllMocks()
                const trigger = callableFlowTrigger({
                    input: { mode: 'simple', exampleData: { sampleData } },
                })
                const result = await migrateV20SubflowsSampleData.migrate(
                    baseFlowVersion(trigger),
                    { log: mockLogger, projectId: 'p-1' },
                )
                expect(mockSave).not.toHaveBeenCalled()
                expect(result.trigger.settings.sampleData?.sampleDataFileId).toBeUndefined()
                expect(result.trigger.settings.input).toEqual({})
            }
        })

        it('looks up projectId from the flow row when not provided in context', async () => {
            mockFlowFindOne.mockResolvedValue({ projectId: 'p-from-row' })
            const trigger = callableFlowTrigger({
                input: { mode: 'simple', exampleData: { sampleData: { foo: 'bar' } } },
            })
            const result = await migrateV20SubflowsSampleData.migrate(
                baseFlowVersion(trigger),
                { log: mockLogger },
            )
            expect(mockFlowFindOne).toHaveBeenCalledWith({
                where: { id: 'f-1' },
                select: ['projectId'],
            })
            expect(mockSave).toHaveBeenCalledTimes(1)
            expect(mockSave.mock.calls[0][0].projectId).toBe('p-from-row')
            expect(result.trigger.settings.sampleData?.sampleDataFileId).toBe(SAVED_FILE_ID)
        })

        it('skips file creation gracefully when projectId can not be resolved (template path)', async () => {
            mockFlowFindOne.mockResolvedValue(null)
            const trigger = callableFlowTrigger({
                input: { mode: 'simple', exampleData: { sampleData: { foo: 'bar' } } },
            })
            const flowVersion = { ...baseFlowVersion(trigger), flowId: '' }
            const result = await migrateV20SubflowsSampleData.migrate(flowVersion, { log: mockLogger })
            expect(mockFlowFindOne).not.toHaveBeenCalled()
            expect(mockSave).not.toHaveBeenCalled()
            expect(result.schemaVersion).toBe('21')
            // legacy keys still cleaned up
            expect(result.trigger.settings.input).toEqual({})
            // no sample data file linked
            expect(result.trigger.settings.sampleData?.sampleDataFileId).toBeUndefined()
        })

        it('skips file creation when flow row is missing entirely', async () => {
            mockFlowFindOne.mockResolvedValue(null)
            const trigger = callableFlowTrigger({
                input: { mode: 'simple', exampleData: { sampleData: { foo: 'bar' } } },
            })
            const result = await migrateV20SubflowsSampleData.migrate(
                baseFlowVersion(trigger),
                { log: mockLogger },
            )
            expect(mockFlowFindOne).toHaveBeenCalledTimes(1)
            expect(mockSave).not.toHaveBeenCalled()
            expect(result.trigger.settings.sampleData?.sampleDataFileId).toBeUndefined()
            expect(result.trigger.settings.input).toEqual({})
        })
    })

    describe('callFlow action', () => {
        it('trims legacy exampleData from the flow dropdown value', async () => {
            const trigger = callableFlowTrigger()
            const action = callFlowAction({
                flow: { externalId: 'target-x', exampleData: { sampleData: { a: 1 } } },
                mode: 'simple',
                flowProps: { payload: { a: 'value' } },
                waitForResponse: false,
            })
            ;(trigger as unknown as { nextAction: unknown }).nextAction = action

            const result = await migrateV20SubflowsSampleData.migrate(
                baseFlowVersion(trigger),
                { log: mockLogger, projectId: 'p-1' },
            )
            const migratedAction = (result.trigger as unknown as { nextAction: typeof action }).nextAction
            expect(migratedAction.settings.input.flow).toEqual({ externalId: 'target-x' })
            // payload preserved
            expect(migratedAction.settings.input.flowProps).toEqual({ payload: { a: 'value' } })
            expect(migratedAction.settings.input.mode).toBe('simple')
        })

        it('is idempotent when flow value already only has externalId', async () => {
            const trigger = callableFlowTrigger()
            const action = callFlowAction({
                flow: { externalId: 'target-x' },
                mode: 'simple',
                flowProps: { payload: {} },
                waitForResponse: false,
            })
            ;(trigger as unknown as { nextAction: unknown }).nextAction = action

            const result = await migrateV20SubflowsSampleData.migrate(
                baseFlowVersion(trigger),
                { log: mockLogger, projectId: 'p-1' },
            )
            const migratedAction = (result.trigger as unknown as { nextAction: typeof action }).nextAction
            expect(migratedAction.settings.input.flow).toEqual({ externalId: 'target-x' })
        })

        it('does not require projectId when only callFlow actions need migrating', async () => {
            const trigger = callableFlowTrigger()
            const action = callFlowAction({
                flow: { externalId: 'target-x', exampleData: {} },
                mode: 'simple',
                flowProps: { payload: {} },
                waitForResponse: false,
            })
            ;(trigger as unknown as { nextAction: unknown }).nextAction = action

            const result = await migrateV20SubflowsSampleData.migrate(
                baseFlowVersion(trigger),
                { log: mockLogger },
            )
            const migratedAction = (result.trigger as unknown as { nextAction: typeof action }).nextAction
            expect(migratedAction.settings.input.flow).toEqual({ externalId: 'target-x' })
        })
    })

    it('does not touch unrelated pieces', async () => {
        const trigger = {
            type: FlowTriggerType.PIECE,
            name: 'trigger',
            displayName: 'Some other trigger',
            valid: true,
            lastUpdatedDate: new Date().toISOString(),
            settings: {
                pieceName: '@activepieces/piece-webhook',
                pieceVersion: '0.4.0',
                triggerName: 'catch_webhook',
                propertySettings: {},
                input: { mode: 'simple', exampleData: { sampleData: { x: 1 } } },
            },
            nextAction: undefined,
        } as unknown as FlowVersion['trigger']

        const result = await migrateV20SubflowsSampleData.migrate(
            baseFlowVersion(trigger),
            { log: mockLogger, projectId: 'p-1' },
        )
        expect(mockSave).not.toHaveBeenCalled()
        // unrelated piece's settings (including pieceVersion) are unchanged
        expect(result.trigger.settings.input).toEqual({
            mode: 'simple',
            exampleData: { sampleData: { x: 1 } },
        })
        expect(result.trigger.settings.pieceVersion).toBe('0.4.0')
    })

    describe('pieceVersion bump', () => {
        it('bumps pieceVersion on the callable-flow trigger', async () => {
            const trigger = callableFlowTrigger({
                pieceVersion: '0.4.13',
                input: { mode: 'simple', exampleData: { sampleData: { foo: 1 } } },
            })
            const result = await migrateV20SubflowsSampleData.migrate(
                baseFlowVersion(trigger),
                { log: mockLogger, projectId: 'p-1' },
            )
            expect(result.trigger.settings.pieceVersion).toBe('0.5.0')
        })

        it('bumps pieceVersion on the callFlow action', async () => {
            const trigger = callableFlowTrigger({ pieceVersion: '0.4.13' })
            const action = callFlowAction({
                flow: { externalId: 'target-x', exampleData: {} },
                mode: 'simple',
                flowProps: { payload: {} },
                waitForResponse: false,
            })
            ;(action.settings as { pieceVersion: string }).pieceVersion = '0.4.13'
            ;(trigger as unknown as { nextAction: unknown }).nextAction = action

            const result = await migrateV20SubflowsSampleData.migrate(
                baseFlowVersion(trigger),
                { log: mockLogger, projectId: 'p-1' },
            )
            const migratedAction = (result.trigger as unknown as { nextAction: typeof action }).nextAction
            expect(migratedAction.settings.pieceVersion).toBe('0.5.0')
        })

        it('bumps pieceVersion on the returnResponse action even though its schema is unchanged', async () => {
            const trigger = callableFlowTrigger({ pieceVersion: '0.4.13' })
            const respondAction = {
                type: FlowActionType.PIECE,
                name: 'respond',
                displayName: 'Return Response',
                valid: true,
                lastUpdatedDate: new Date().toISOString(),
                skip: false,
                settings: {
                    pieceName: SUBFLOWS_PIECE,
                    pieceVersion: '0.4.13',
                    actionName: 'returnResponse',
                    propertySettings: {},
                    input: { mode: 'simple', response: { response: { ok: true } } },
                },
                nextAction: undefined,
            }
            ;(trigger as unknown as { nextAction: unknown }).nextAction = respondAction

            const result = await migrateV20SubflowsSampleData.migrate(
                baseFlowVersion(trigger),
                { log: mockLogger, projectId: 'p-1' },
            )
            const migrated = (result.trigger as unknown as { nextAction: typeof respondAction }).nextAction
            expect(migrated.settings.pieceVersion).toBe('0.5.0')
            // returnResponse's input shape is preserved
            expect(migrated.settings.input).toEqual({
                mode: 'simple',
                response: { response: { ok: true } },
            })
        })
    })
})

// silence unused import warning under noUnusedLocals
void FlowStatus
