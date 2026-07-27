import { Property } from '@activepieces/pieces-framework'
import {
    BranchExecutionType,
    FlowActionType,
    flowStructureUtil,
    FlowTriggerType,
    FlowVersion,
    FlowVersionState,
    PropertyExecutionType,
    RouterExecutionType,
} from '@activepieces/shared'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockGet = vi.fn()

vi.mock('../../../../../src/app/helper/system/system', () => ({
    system: { globalLogger: () => ({ info: vi.fn(), error: vi.fn() }) },
}))

vi.mock('../../../../../src/app/pieces/metadata/piece-metadata-service', () => ({
    pieceMetadataService: () => ({ get: mockGet }),
}))

vi.mock('../../../../../src/app/project/project-service', () => ({
    projectService: () => ({ getPlatformId: async () => 'platform-1' }),
}))

vi.mock('../../../../../src/app/flows/flow/flow.service', () => ({
    flowService: () => ({ getOneById: async () => ({ id: 'flow-1', projectId: 'project-1' }) }),
}))

import { migrateV22MultiSelectDynamicValues } from '../../../../../src/app/flows/flow-version/migrations/migrate-v22-multi-select-dynamic-values'

const ACTION_PROPS = {
    unitExtract: Property.StaticMultiSelectDropdown({
        displayName: 'Unit to Extract',
        required: true,
        defaultValue: ['year'],
        options: {
            options: [
                { label: 'Year', value: 'year' },
                { label: 'Day', value: 'day' },
            ],
        },
    }),
    enabled: Property.Checkbox({ displayName: 'Enabled', required: false }),
    inputDate: Property.ShortText({ displayName: 'Input Date', required: true }),
    inputFormat: Property.StaticDropdown({
        displayName: 'From Time Format',
        required: true,
        options: { options: [{ label: 'ISO', value: '["year","day"]' }] },
    }),
}

const TRIGGER_PROPS = {
    units: Property.StaticMultiSelectDropdown({
        displayName: 'Units',
        required: false,
        options: { options: [{ label: 'Year', value: 'year' }] },
    }),
}

const flowVersionWith = ({ input, propertySettings }: {
    input: Record<string, unknown>
    propertySettings: Record<string, { type: PropertyExecutionType }>
}): FlowVersion => ({
    id: 'fv-1',
    displayName: 'fixture',
    flowId: 'flow-1',
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
    updatedBy: null,
    valid: true,
    state: FlowVersionState.DRAFT,
    schemaVersion: '22',
    connectionIds: [],
    agentIds: [],
    notes: [],
    trigger: {
        type: FlowTriggerType.PIECE,
        name: 'trigger',
        displayName: 'Trigger',
        valid: true,
        lastUpdatedDate: new Date().toISOString(),
        settings: {
            pieceName: '@activepieces/piece-webhook',
            pieceVersion: '0.0.1',
            triggerName: 'catch_request',
            input: {},
            propertySettings: {},
        },
        nextAction: {
            type: FlowActionType.PIECE,
            name: 'step_1',
            displayName: 'Extract Date Units',
            valid: true,
            lastUpdatedDate: new Date().toISOString(),
            settings: {
                pieceName: '@activepieces/piece-date-helper',
                pieceVersion: '0.3.0',
                actionName: 'extract_date_parts',
                input,
                propertySettings,
            },
        },
    },
})

const migratedStep = async (flowVersion: FlowVersion) => {
    const migrated = await migrateV22MultiSelectDynamicValues.migrate(flowVersion)
    expect(migrated.schemaVersion).toBe('23')
    return migrated.trigger.nextAction
}

describe('migrateV22MultiSelectDynamicValues', () => {
    beforeEach(() => {
        mockGet.mockReset()
        mockGet.mockResolvedValue({
            actions: { extract_date_parts: { props: ACTION_PROPS } },
            triggers: {},
        })
    })

    it('restores a stringified selection and switches the field back to manual', async () => {
        const step = await migratedStep(flowVersionWith({
            input: { unitExtract: '["year","day"]', inputDate: '2026-07-27' },
            propertySettings: {
                unitExtract: { type: PropertyExecutionType.DYNAMIC },
                inputDate: { type: PropertyExecutionType.MANUAL },
            },
        }))

        expect(step?.settings.input.unitExtract).toEqual(['year', 'day'])
        expect(step?.settings.propertySettings.unitExtract.type).toBe(PropertyExecutionType.MANUAL)
        expect(step?.settings.input.inputDate).toBe('2026-07-27')
        expect(step?.settings.propertySettings.inputDate.type).toBe(PropertyExecutionType.MANUAL)
    })

    it('restores the customer empty-selection case', async () => {
        const step = await migratedStep(flowVersionWith({
            input: { unitExtract: '[]' },
            propertySettings: { unitExtract: { type: PropertyExecutionType.DYNAMIC } },
        }))

        expect(step?.settings.input.unitExtract).toEqual([])
        expect(step?.settings.propertySettings.unitExtract.type).toBe(PropertyExecutionType.MANUAL)
    })

    it('restores a stringified checkbox', async () => {
        const step = await migratedStep(flowVersionWith({
            input: { enabled: 'false' },
            propertySettings: { enabled: { type: PropertyExecutionType.DYNAMIC } },
        }))

        expect(step?.settings.input.enabled).toBe(false)
        expect(step?.settings.propertySettings.enabled.type).toBe(PropertyExecutionType.MANUAL)
    })

    it('leaves a real dynamic expression untouched', async () => {
        const step = await migratedStep(flowVersionWith({
            input: { unitExtract: '{{ trigger.body.units }}' },
            propertySettings: { unitExtract: { type: PropertyExecutionType.DYNAMIC } },
        }))

        expect(step?.settings.input.unitExtract).toBe('{{ trigger.body.units }}')
        expect(step?.settings.propertySettings.unitExtract.type).toBe(PropertyExecutionType.DYNAMIC)
    })

    it('leaves a value that cannot be interpreted untouched', async () => {
        const step = await migratedStep(flowVersionWith({
            input: { unitExtract: 'year' },
            propertySettings: { unitExtract: { type: PropertyExecutionType.DYNAMIC } },
        }))

        expect(step?.settings.input.unitExtract).toBe('year')
        expect(step?.settings.propertySettings.unitExtract.type).toBe(PropertyExecutionType.DYNAMIC)
    })

    it('leaves a text property alone even when its value parses to an array', async () => {
        const step = await migratedStep(flowVersionWith({
            input: { inputDate: '["year","day"]' },
            propertySettings: { inputDate: { type: PropertyExecutionType.DYNAMIC } },
        }))

        expect(step?.settings.input.inputDate).toBe('["year","day"]')
        expect(step?.settings.propertySettings.inputDate.type).toBe(PropertyExecutionType.DYNAMIC)
    })

    it('leaves a single-select dropdown alone even when its value parses to an array', async () => {
        const step = await migratedStep(flowVersionWith({
            input: { inputFormat: '["year","day"]' },
            propertySettings: { inputFormat: { type: PropertyExecutionType.DYNAMIC } },
        }))

        expect(step?.settings.input.inputFormat).toBe('["year","day"]')
        expect(step?.settings.propertySettings.inputFormat.type).toBe(PropertyExecutionType.DYNAMIC)
    })

    it('leaves a property that no longer exists on the piece alone', async () => {
        const step = await migratedStep(flowVersionWith({
            input: { removedProp: '["year","day"]' },
            propertySettings: { removedProp: { type: PropertyExecutionType.DYNAMIC } },
        }))

        expect(step?.settings.input.removedProp).toBe('["year","day"]')
        expect(step?.settings.propertySettings.removedProp.type).toBe(PropertyExecutionType.DYNAMIC)
    })

    it.each([
        ['the piece metadata is gone', null],
        ['the metadata carries no actions map', { triggers: {} }],
        ['the action is gone from the metadata', { actions: {}, triggers: {} }],
    ])('still bumps the schema version and changes nothing when %s', async (_name, metadata) => {
        mockGet.mockResolvedValue(metadata)
        const step = await migratedStep(flowVersionWith({
            input: { unitExtract: '["year","day"]' },
            propertySettings: { unitExtract: { type: PropertyExecutionType.DYNAMIC } },
        }))

        expect(step?.settings.input.unitExtract).toBe('["year","day"]')
        expect(step?.settings.propertySettings.unitExtract.type).toBe(PropertyExecutionType.DYNAMIC)
    })

    it('recovers a trigger property, not just actions', async () => {
        mockGet.mockResolvedValue({
            actions: { extract_date_parts: { props: ACTION_PROPS } },
            triggers: { catch_request: { props: TRIGGER_PROPS } },
        })
        const flowVersion = flowVersionWith({
            input: {},
            propertySettings: {},
        })
        flowVersion.trigger.settings.input = { units: '["year"]' }
        flowVersion.trigger.settings.propertySettings = {
            units: { type: PropertyExecutionType.DYNAMIC },
        }

        const migrated = await migrateV22MultiSelectDynamicValues.migrate(flowVersion)

        expect(migrated.trigger.settings.input.units).toEqual(['year'])
        expect(migrated.trigger.settings.propertySettings.units.type).toBe(PropertyExecutionType.MANUAL)
    })

    it('recovers a step nested inside a router branch', async () => {
        const flowVersion = flowVersionWith({
            input: {},
            propertySettings: {},
        })
        flowVersion.trigger.nextAction = {
            type: FlowActionType.ROUTER,
            name: 'router',
            displayName: 'Router',
            valid: true,
            lastUpdatedDate: new Date().toISOString(),
            settings: {
                branches: [{
                    branchType: BranchExecutionType.FALLBACK,
                    branchName: 'Otherwise',
                }],
                executionType: RouterExecutionType.EXECUTE_FIRST_MATCH,
                inputUiInfo: {},
            },
            children: [{
                type: FlowActionType.PIECE,
                name: 'step_nested',
                displayName: 'Nested',
                valid: true,
                lastUpdatedDate: new Date().toISOString(),
                settings: {
                    pieceName: '@activepieces/piece-date-helper',
                    pieceVersion: '0.3.0',
                    actionName: 'extract_date_parts',
                    input: { unitExtract: '["day"]' },
                    propertySettings: { unitExtract: { type: PropertyExecutionType.DYNAMIC } },
                },
            }],
        }

        const migrated = await migrateV22MultiSelectDynamicValues.migrate(flowVersion)
        const nested = flowStructureUtil.getStepOrThrow('step_nested', migrated.trigger)

        expect(nested.settings.input.unitExtract).toEqual(['day'])
        expect(nested.settings.propertySettings.unitExtract.type).toBe(PropertyExecutionType.MANUAL)
    })

    it('is a no-op when run a second time', async () => {
        const once = await migrateV22MultiSelectDynamicValues.migrate(flowVersionWith({
            input: { unitExtract: '["year","day"]' },
            propertySettings: { unitExtract: { type: PropertyExecutionType.DYNAMIC } },
        }))
        const twice = await migrateV22MultiSelectDynamicValues.migrate(once)

        expect(twice.trigger.nextAction?.settings.input.unitExtract).toEqual(['year', 'day'])
        expect(twice).toEqual({ ...once, schemaVersion: '23' })
    })

    it('preserves the rest of the flow version and other steps', async () => {
        const flowVersion = flowVersionWith({
            input: { unitExtract: '["year"]' },
            propertySettings: { unitExtract: { type: PropertyExecutionType.DYNAMIC } },
        })
        flowVersion.trigger.nextAction!.nextAction = {
            type: FlowActionType.CODE,
            name: 'step_code',
            displayName: 'Code',
            valid: true,
            lastUpdatedDate: new Date().toISOString(),
            settings: {
                sourceCode: { code: 'export const code = async () => 1', packageJson: '{}' },
                input: { untouched: '["not","a","multiselect"]' },
                propertySettings: { untouched: { type: PropertyExecutionType.DYNAMIC } },
            },
        }

        const migrated = await migrateV22MultiSelectDynamicValues.migrate(flowVersion)
        const codeStep = flowStructureUtil.getStepOrThrow('step_code', migrated.trigger)

        expect(codeStep.settings.input.untouched).toBe('["not","a","multiselect"]')
        expect(migrated.id).toBe(flowVersion.id)
        expect(migrated.displayName).toBe(flowVersion.displayName)
        expect(migrated.state).toBe(flowVersion.state)
        expect(migrated.connectionIds).toEqual(flowVersion.connectionIds)
    })
})
