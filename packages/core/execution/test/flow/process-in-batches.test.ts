import {
    FlowAction,
    FlowActionType,
    flowOperations,
    FlowOperationRequest,
    FlowOperationType,
    flowStructureUtil,
    FlowTriggerType,
    FlowVersion,
    FlowVersionState,
    LATEST_FLOW_SCHEMA_VERSION,
    ProcessInBatchesAction,
    StepLocationRelativeToParent,
    UpdateActionRequest,
} from '../../src'

const emptyFlowVersion: FlowVersion = {
    id: 'processInBatchesFlowVersion',
    created: '2026-08-09T00:00:00.000Z',
    updated: '2026-08-09T00:00:00.000Z',
    flowId: 'processInBatchesFlow',
    updatedBy: '',
    displayName: 'Process in Batches',
    agentIds: [],
    notes: [],
    valid: false,
    schemaVersion: LATEST_FLOW_SCHEMA_VERSION,
    state: FlowVersionState.DRAFT,
    connectionIds: [],
    trigger: {
        name: 'trigger',
        type: FlowTriggerType.EMPTY,
        valid: true,
        displayName: 'Select Trigger',
        settings: {},
    },
}

function addBatchStep({ name = 'step_1', batchSize = 10, items = '{{ trigger }}', parentStep = 'trigger', stepLocationRelativeToParent }: {
    name?: string
    batchSize?: number
    items?: string
    parentStep?: string
    stepLocationRelativeToParent?: StepLocationRelativeToParent
} = {}): FlowOperationRequest {
    return {
        type: FlowOperationType.ADD_ACTION,
        request: {
            parentStep,
            stepLocationRelativeToParent,
            action: {
                name,
                type: FlowActionType.PROCESS_IN_BATCHES,
                displayName: 'Process in Batches',
                valid: true,
                settings: { items, batchSize },
            },
        },
    }
}

function addCodeStep({ name, parentStep, stepLocationRelativeToParent }: {
    name: string
    parentStep: string
    stepLocationRelativeToParent?: StepLocationRelativeToParent
}): FlowOperationRequest {
    return {
        type: FlowOperationType.ADD_ACTION,
        request: {
            parentStep,
            stepLocationRelativeToParent,
            action: {
                name,
                type: FlowActionType.CODE,
                displayName: 'Code',
                valid: true,
                settings: {
                    input: {},
                    sourceCode: { code: 'test', packageJson: '{}' },
                },
            },
        },
    }
}

function applyAll(operations: FlowOperationRequest[], flowVersion: FlowVersion = emptyFlowVersion): FlowVersion {
    return operations.reduce((flow, operation) => flowOperations.apply(flow, operation), flowVersion)
}

function batchStepOf(flowVersion: FlowVersion, name = 'step_1'): ProcessInBatchesAction {
    const step = flowStructureUtil.getActionOrThrow(name, flowVersion.trigger)
    if (step.type !== FlowActionType.PROCESS_IN_BATCHES) {
        throw new Error(`expected ${name} to be a process in batches step`)
    }
    return step
}

function withFrozenTimestamps(flowVersion: FlowVersion): FlowVersion {
    return flowStructureUtil.transferFlow(flowVersion, (step) => ({
        ...step,
        lastUpdatedDate: 'frozen',
    }))
}

function batchStepSettings(batchSize: unknown): unknown {
    return {
        name: 'step_1',
        type: FlowActionType.PROCESS_IN_BATCHES,
        displayName: 'Process in Batches',
        valid: true,
        settings: { items: '{{ trigger }}', batchSize },
    }
}

describe('Process in Batches step', () => {
    it('adds a batch step with items and a batch size, and comes back valid', () => {
        const flowVersion = applyAll([addBatchStep({ batchSize: 25 })])
        const step = batchStepOf(flowVersion)

        expect(step.settings).toEqual({ items: '{{ trigger }}', batchSize: 25 })
        expect(step.valid).toBe(true)
        expect(flowVersion.valid).toBe(true)
    })

    it.each([0, -1, 1.5])('marks the step invalid for a batch size of %s without clamping it', (batchSize) => {
        const flowVersion = applyAll([addBatchStep({ batchSize })])
        const step = batchStepOf(flowVersion)

        expect(step.valid).toBe(false)
        expect(step.settings.batchSize).toBe(batchSize)
    })

    it('rejects a mention expression as a batch size at the API boundary', () => {
        const result = UpdateActionRequest.safeParse(batchStepSettings('{{ trigger.count }}'))
        expect(result.success).toBe(false)
    })

    it('reports the batch size floor with a message that is a translation key', () => {
        const result = UpdateActionRequest.safeParse(batchStepSettings(0))
        expect(result.success).toBe(false)
        expect(JSON.stringify(result.error)).toContain('batchSizeMustBeAtLeastOne')
    })

    it('defaults the batch size to 10 when it is omitted', () => {
        const result = UpdateActionRequest.parse({
            name: 'step_1',
            type: FlowActionType.PROCESS_IN_BATCHES,
            displayName: 'Process in Batches',
            valid: true,
            settings: { items: '{{ trigger }}' },
        })
        expect(result.settings).toEqual({ items: '{{ trigger }}', batchSize: 10 })
    })

    it('adds, moves, duplicates, pastes out of and deletes steps in the body', () => {
        const withBody = applyAll([
            addBatchStep(),
            addCodeStep({ name: 'step_2', parentStep: 'step_1', stepLocationRelativeToParent: StepLocationRelativeToParent.INSIDE_BATCH }),
            addCodeStep({ name: 'step_3', parentStep: 'step_1', stepLocationRelativeToParent: StepLocationRelativeToParent.AFTER }),
        ])
        expect(batchStepOf(withBody).firstLoopAction?.name).toBe('step_2')

        const afterMove = applyAll([{
            type: FlowOperationType.MOVE_ACTION,
            request: {
                name: 'step_3',
                newParentStep: 'step_1',
                stepLocationRelativeToNewParent: StepLocationRelativeToParent.INSIDE_BATCH,
            },
        }], withBody)
        expect(batchStepOf(afterMove).firstLoopAction?.name).toBe('step_3')
        expect(batchStepOf(afterMove).firstLoopAction?.nextAction?.name).toBe('step_2')

        const afterDuplicate = applyAll([{
            type: FlowOperationType.DUPLICATE_ACTION,
            request: { stepName: 'step_1' },
        }], afterMove)
        const duplicated = batchStepOf(afterDuplicate, 'step_4')
        expect(duplicated.settings.batchSize).toBe(10)
        expect(flowStructureUtil.getAllChildSteps(duplicated).map((step) => step.name)).toEqual(['step_4', 'step_5', 'step_6'])

        const copied = flowOperations.getActionsForCopy(['step_2'], afterMove)
        const afterPaste = applyAll(flowOperations.getOperationsForPaste(copied, afterMove, {
            parentStepName: 'step_1',
            stepLocationRelativeToParent: StepLocationRelativeToParent.AFTER,
        }), afterMove)
        expect(batchStepOf(afterPaste).nextAction?.name).toBe('step_4')

        const afterDelete = applyAll([{
            type: FlowOperationType.DELETE_ACTION,
            request: { names: ['step_3'] },
        }], afterMove)
        expect(batchStepOf(afterDelete).firstLoopAction?.name).toBe('step_2')
    })

    it('rejects the batch location on a loop parent and the loop location on a batch parent', () => {
        const withLoop = applyAll([{
            type: FlowOperationType.ADD_ACTION,
            request: {
                parentStep: 'trigger',
                action: {
                    name: 'step_1',
                    type: FlowActionType.LOOP_ON_ITEMS,
                    displayName: 'Loop',
                    valid: true,
                    settings: { items: '{{ trigger }}' },
                },
            },
        }])
        expect(() => applyAll([addCodeStep({
            name: 'step_2',
            parentStep: 'step_1',
            stepLocationRelativeToParent: StepLocationRelativeToParent.INSIDE_BATCH,
        })], withLoop)).toThrow()

        const withBatch = applyAll([addBatchStep()])
        expect(() => applyAll([addCodeStep({
            name: 'step_2',
            parentStep: 'step_1',
            stepLocationRelativeToParent: StepLocationRelativeToParent.INSIDE_LOOP,
        })], withBatch)).toThrow()
    })

    it('refuses a batch step anywhere inside another batch step', () => {
        const withBatch = applyAll([addBatchStep()])
        expect(() => applyAll([addBatchStep({
            name: 'step_2',
            parentStep: 'step_1',
            stepLocationRelativeToParent: StepLocationRelativeToParent.INSIDE_BATCH,
        })], withBatch)).toThrow()

        const withLoopInsideBatch = applyAll([{
            type: FlowOperationType.ADD_ACTION,
            request: {
                parentStep: 'step_1',
                stepLocationRelativeToParent: StepLocationRelativeToParent.INSIDE_BATCH,
                action: {
                    name: 'step_2',
                    type: FlowActionType.LOOP_ON_ITEMS,
                    displayName: 'Loop',
                    valid: true,
                    settings: { items: '{{ trigger }}' },
                },
            },
        }], withBatch)
        expect(() => applyAll([addBatchStep({
            name: 'step_3',
            parentStep: 'step_2',
            stepLocationRelativeToParent: StepLocationRelativeToParent.INSIDE_LOOP,
        })], withLoopInsideBatch)).toThrow()
    })

    it('allows a batch step after another batch step, and inside a top-level loop', () => {
        const withBatch = applyAll([addBatchStep()])
        expect(() => applyAll([addBatchStep({
            name: 'step_2',
            parentStep: 'step_1',
            stepLocationRelativeToParent: StepLocationRelativeToParent.AFTER,
        })], withBatch)).not.toThrow()

        const withLoop = applyAll([{
            type: FlowOperationType.ADD_ACTION,
            request: {
                parentStep: 'trigger',
                action: {
                    name: 'step_1',
                    type: FlowActionType.LOOP_ON_ITEMS,
                    displayName: 'Loop',
                    valid: true,
                    settings: { items: '{{ trigger }}' },
                },
            },
        }])
        expect(() => applyAll([addBatchStep({
            name: 'step_2',
            parentStep: 'step_1',
            stepLocationRelativeToParent: StepLocationRelativeToParent.INSIDE_LOOP,
        })], withLoop)).not.toThrow()
    })

    it('traverses into the body', () => {
        const flowVersion = applyAll([
            addBatchStep(),
            addCodeStep({ name: 'step_2', parentStep: 'step_1', stepLocationRelativeToParent: StepLocationRelativeToParent.INSIDE_BATCH }),
            addCodeStep({ name: 'step_3', parentStep: 'step_2', stepLocationRelativeToParent: StepLocationRelativeToParent.AFTER }),
        ])

        expect(flowStructureUtil.getAllSteps(flowVersion.trigger).map((step) => step.name))
            .toEqual(['trigger', 'step_1', 'step_2', 'step_3'])
        expect(flowStructureUtil.findPathToStep(flowVersion.trigger, 'step_3').map((step) => step.name))
            .toEqual(['trigger', 'step_1', 'step_2'])
        expect(flowStructureUtil.isChildOf(batchStepOf(flowVersion), 'step_3')).toBe(true)
    })

    it('round-trips a nested body through export and re-import', () => {
        const flowVersion = applyAll([
            addBatchStep(),
            addCodeStep({ name: 'step_2', parentStep: 'step_1', stepLocationRelativeToParent: StepLocationRelativeToParent.INSIDE_BATCH }),
            addCodeStep({ name: 'step_3', parentStep: 'step_2', stepLocationRelativeToParent: StepLocationRelativeToParent.AFTER }),
        ])

        const reimported = flowOperations.apply(emptyFlowVersion, {
            type: FlowOperationType.IMPORT_FLOW,
            request: {
                displayName: flowVersion.displayName,
                trigger: flowVersion.trigger,
                schemaVersion: flowVersion.schemaVersion ?? null,
                notes: flowVersion.notes,
            },
        })

        expect(withFrozenTimestamps(reimported).trigger).toEqual(withFrozenTimestamps(flowVersion).trigger)
    })

    it('carries error handling options and no continue-on-failure branches', () => {
        const flowVersion = applyAll([{
            type: FlowOperationType.ADD_ACTION,
            request: {
                parentStep: 'trigger',
                action: {
                    name: 'step_1',
                    type: FlowActionType.PROCESS_IN_BATCHES,
                    displayName: 'Process in Batches',
                    valid: true,
                    settings: {
                        items: '{{ trigger }}',
                        batchSize: 10,
                        errorHandlingOptions: { continueOnFailure: { value: true } },
                    },
                },
            },
        }])
        const step: FlowAction = batchStepOf(flowVersion)

        expect(step.settings.errorHandlingOptions?.continueOnFailure?.value).toBe(true)
        expect('continueOnFailureBranches' in step).toBe(false)
    })

    it('keeps the flow schema version unchanged', () => {
        expect(LATEST_FLOW_SCHEMA_VERSION).toBe('23')
    })
})
