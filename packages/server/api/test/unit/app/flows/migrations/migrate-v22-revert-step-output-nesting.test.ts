import {
    FlowActionType,
    FlowTriggerType,
    FlowVersion,
    FlowVersionState,
} from '@activepieces/shared'
import { describe, expect, it } from 'vitest'
import { migrateV21StepOutputNesting } from '../../../../../src/app/flows/flow-version/migrations/migrate-v21-step-output-nesting'
import { migrateV22RevertStepOutputNesting } from '../../../../../src/app/flows/flow-version/migrations/migrate-v22-revert-step-output-nesting'

const baseVersion = (trigger: FlowVersion['trigger'], schemaVersion: string): FlowVersion => ({
    id: 'fv-1',
    displayName: 'fixture',
    flowId: 'flow-1',
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
    updatedBy: null,
    valid: true,
    trigger,
    state: FlowVersionState.DRAFT,
    schemaVersion,
    connectionIds: [],
    agentIds: [],
    notes: [],
})

const triggerWithStep = (input: Record<string, unknown>, schemaVersion: string): FlowVersion => baseVersion({
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
        displayName: 'Step 1',
        skip: false,
        valid: true,
        lastUpdatedDate: new Date().toISOString(),
        settings: {
            pieceName: '@activepieces/piece-test',
            pieceVersion: '0.0.1',
            actionName: 'do',
            input,
            propertySettings: {},
        },
    },
}, schemaVersion)

const fieldOf = (version: FlowVersion): unknown => version.trigger.nextAction?.settings.input.field

describe('migrateV22RevertStepOutputNesting', () => {
    it('strips the injected ["output"] member after a step reference', async () => {
        const result = await migrateV22RevertStepOutputNesting.migrate(triggerWithStep({ field: '{{step_1[\'output\'].foo}}' }, '22'))
        expect(fieldOf(result)).toBe('{{step_1.foo}}')
        expect(result.schemaVersion).toBe('23')
    })

    it('strips ["output"] after a trigger reference', async () => {
        const result = await migrateV22RevertStepOutputNesting.migrate(triggerWithStep({ field: 'Price is {{ trigger[\'output\'].price }}' }, '22'))
        expect(fieldOf(result)).toBe('Price is {{ trigger.price }}')
    })

    it('recovers a bare step reference', async () => {
        const result = await migrateV22RevertStepOutputNesting.migrate(triggerWithStep({ field: '{{step_1[\'output\']}}' }, '22'))
        expect(fieldOf(result)).toBe('{{step_1}}')
    })

    it('recovers a step whose authored path was already ".output"', async () => {
        const result = await migrateV22RevertStepOutputNesting.migrate(triggerWithStep({ field: '{{step_1[\'output\'].output}}' }, '22'))
        expect(fieldOf(result)).toBe('{{step_1.output}}')
    })

    it('leaves locally-shadowed names untouched', async () => {
        const result = await migrateV22RevertStepOutputNesting.migrate(triggerWithStep({ field: '{{ (step_1) => step_1.bar }}' }, '22'))
        expect(fieldOf(result)).toBe('{{ (step_1) => step_1.bar }}')
    })

    it('drops continue-on-failure branches from CODE/PIECE steps', async () => {
        const version = triggerWithStep({ field: '{{step_1[\'output\'].foo}}' }, '22')
        version.trigger.nextAction!.settings.errorHandlingOptions = {
            continueOnFailure: { value: true },
            continueOnFailureBranches: {
                onSuccess: {
                    type: FlowActionType.CODE,
                    name: 'step_2',
                    displayName: 'On success',
                    skip: false,
                    valid: true,
                    settings: { sourceCode: { code: '', packageJson: '' }, input: {}, propertySettings: {} },
                },
            },
        }
        const result = await migrateV22RevertStepOutputNesting.migrate(version)
        const errorHandlingOptions = result.trigger.nextAction?.settings.errorHandlingOptions
        expect(errorHandlingOptions?.continueOnFailureBranches).toBeUndefined()
        expect(errorHandlingOptions?.continueOnFailure?.value).toBe(true)
    })

    describe('round-trip: v21 → forward (v22) → inverse (v23) recovers the original', () => {
        it.each([
            '{{step_1.foo}}',
            '{{step_1}}',
            '{{step_1.output}}',
            'Price is {{ trigger.price }} and {{step_1.bar}}',
            '{{ step_1.foo + step_1.bar }}',
        ])('preserves %s', async (original) => {
            const forward = await migrateV21StepOutputNesting.migrate(triggerWithStep({ field: original }, '21'))
            expect(forward.schemaVersion).toBe('22')
            const inverse = await migrateV22RevertStepOutputNesting.migrate(forward)
            expect(inverse.schemaVersion).toBe('23')
            expect(fieldOf(inverse)).toBe(original)
        })
    })
})
