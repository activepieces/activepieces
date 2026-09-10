import {
    FlowActionType,
    flowOperations,
    FlowOperationType,
    flowStructureUtil,
    FlowTriggerType,
    FlowVersion,
    FlowVersionState,
    PieceAction,
    PieceTrigger,
    PropertyExecutionType,
} from '../../src'

const TRIGGER_LAST_UPDATED = '2026-01-01T00:00:00.000Z'
const ACTION_LAST_UPDATED = '2026-01-02T00:00:00.000Z'
const TRIGGER_SAMPLE_FILE_ID = 'trigger_sample_file'
const ACTION_SAMPLE_FILE_ID = 'action_sample_file'

function createFlowVersion(): FlowVersion {
    return {
        id: 'pj0KQ7Aypoa9OQGHzmKDl',
        created: '2023-05-24T00:16:41.353Z',
        updated: '2023-05-24T00:16:41.353Z',
        flowId: 'lod6JEdKyPlvrnErdnrGa',
        updatedBy: '',
        displayName: 'Rename test',
        agentIds: [],
        notes: [],
        connectionIds: [],
        valid: true,
        state: FlowVersionState.DRAFT,
        trigger: {
            name: 'trigger',
            type: FlowTriggerType.PIECE,
            valid: true,
            displayName: 'Every Hour',
            lastUpdatedDate: TRIGGER_LAST_UPDATED,
            settings: {
                pieceName: 'schedule',
                pieceVersion: '0.0.2',
                triggerName: 'cron_expression',
                input: {
                    cronExpression: '25 10 * * 0,1,2,3,4',
                },
                propertySettings: {
                    cronExpression: {
                        type: PropertyExecutionType.MANUAL,
                    },
                },
                sampleData: {
                    sampleDataFileId: TRIGGER_SAMPLE_FILE_ID,
                    lastTestDate: '2026-01-03T00:00:00.000Z',
                },
            },
            nextAction: {
                name: 'step_1',
                type: FlowActionType.PIECE,
                valid: true,
                displayName: 'Get',
                lastUpdatedDate: ACTION_LAST_UPDATED,
                settings: {
                    pieceName: 'store',
                    pieceVersion: '0.2.6',
                    actionName: 'get',
                    input: {
                        key: '1',
                    },
                    propertySettings: {
                        key: {
                            type: PropertyExecutionType.MANUAL,
                        },
                    },
                    sampleData: {
                        sampleDataFileId: ACTION_SAMPLE_FILE_ID,
                        lastTestDate: '2026-01-03T00:00:00.000Z',
                    },
                },
            },
        },
    }
}

function getAction(flowVersion: FlowVersion): PieceAction {
    const step = flowStructureUtil.getStepOrThrow('step_1', flowVersion.trigger)
    if (step.type !== FlowActionType.PIECE) {
        throw new Error('expected a piece action')
    }
    return step
}

function getTrigger(flowVersion: FlowVersion): PieceTrigger {
    if (flowVersion.trigger.type !== FlowTriggerType.PIECE) {
        throw new Error('expected a piece trigger')
    }
    return flowVersion.trigger
}

describe('rename-only updates keep the tested status (GIT-1873)', () => {
    it('CLAIM 1: UPDATE_ACTION changing only displayName keeps lastUpdatedDate and sample data', () => {
        const flowVersion = createFlowVersion()
        const action = getAction(flowVersion)
        const result = flowOperations.apply(flowVersion, {
            type: FlowOperationType.UPDATE_ACTION,
            request: {
                type: FlowActionType.PIECE,
                name: action.name,
                displayName: 'Get Renamed',
                valid: action.valid,
                settings: action.settings,
            },
        })
        const updated = getAction(result)
        expect(updated.displayName).toBe('Get Renamed')
        expect(updated.lastUpdatedDate).toBe(ACTION_LAST_UPDATED)
        expect(updated.settings.sampleData?.sampleDataFileId).toBe(ACTION_SAMPLE_FILE_ID)
    })

    it('CLAIM 2: UPDATE_ACTION changing input still bumps lastUpdatedDate', () => {
        const flowVersion = createFlowVersion()
        const action = getAction(flowVersion)
        const result = flowOperations.apply(flowVersion, {
            type: FlowOperationType.UPDATE_ACTION,
            request: {
                type: FlowActionType.PIECE,
                name: action.name,
                displayName: action.displayName,
                valid: action.valid,
                settings: {
                    ...action.settings,
                    input: {
                        key: '2',
                    },
                },
            },
        })
        const updated = getAction(result)
        expect(updated.lastUpdatedDate).not.toBe(ACTION_LAST_UPDATED)
        expect(updated.settings.sampleData?.sampleDataFileId).toBe(ACTION_SAMPLE_FILE_ID)
    })

    it('CLAIM 3: UPDATE_ACTION renaming and changing input together bumps lastUpdatedDate', () => {
        const flowVersion = createFlowVersion()
        const action = getAction(flowVersion)
        const result = flowOperations.apply(flowVersion, {
            type: FlowOperationType.UPDATE_ACTION,
            request: {
                type: FlowActionType.PIECE,
                name: action.name,
                displayName: 'Get Renamed',
                valid: action.valid,
                settings: {
                    ...action.settings,
                    input: {
                        key: '2',
                    },
                },
            },
        })
        expect(getAction(result).lastUpdatedDate).not.toBe(ACTION_LAST_UPDATED)
    })

    it('CLAIM 4: UPDATE_ACTION rename with stale sampleData in the request is still rename-only', () => {
        const flowVersion = createFlowVersion()
        const action = getAction(flowVersion)
        const result = flowOperations.apply(flowVersion, {
            type: FlowOperationType.UPDATE_ACTION,
            request: {
                type: FlowActionType.PIECE,
                name: action.name,
                displayName: 'Get Renamed',
                valid: action.valid,
                settings: {
                    ...action.settings,
                    sampleData: undefined,
                },
            },
        })
        const updated = getAction(result)
        expect(updated.lastUpdatedDate).toBe(ACTION_LAST_UPDATED)
        expect(updated.settings.sampleData?.sampleDataFileId).toBe(ACTION_SAMPLE_FILE_ID)
    })

    it('CLAIM 5: UPDATE_TRIGGER changing only displayName keeps lastUpdatedDate and sample data', () => {
        const flowVersion = createFlowVersion()
        const trigger = getTrigger(flowVersion)
        const result = flowOperations.apply(flowVersion, {
            type: FlowOperationType.UPDATE_TRIGGER,
            request: {
                type: FlowTriggerType.PIECE,
                name: trigger.name,
                displayName: 'Every Hour Renamed',
                valid: trigger.valid,
                settings: trigger.settings,
            },
        })
        const updated = getTrigger(result)
        expect(updated.displayName).toBe('Every Hour Renamed')
        expect(updated.lastUpdatedDate).toBe(TRIGGER_LAST_UPDATED)
        expect(updated.settings.sampleData?.sampleDataFileId).toBe(TRIGGER_SAMPLE_FILE_ID)
        expect(updated.nextAction?.name).toBe('step_1')
    })

    it('CLAIM 6: UPDATE_TRIGGER changing input still bumps lastUpdatedDate', () => {
        const flowVersion = createFlowVersion()
        const trigger = getTrigger(flowVersion)
        const result = flowOperations.apply(flowVersion, {
            type: FlowOperationType.UPDATE_TRIGGER,
            request: {
                type: FlowTriggerType.PIECE,
                name: trigger.name,
                displayName: trigger.displayName,
                valid: trigger.valid,
                settings: {
                    ...trigger.settings,
                    input: {
                        cronExpression: '0 * * * *',
                    },
                },
            },
        })
        const updated = getTrigger(result)
        expect(updated.lastUpdatedDate).not.toBe(TRIGGER_LAST_UPDATED)
    })

    it('CLAIM 7: UPDATE_TRIGGER replacing the piece bumps lastUpdatedDate', () => {
        const flowVersion = createFlowVersion()
        const trigger = getTrigger(flowVersion)
        const result = flowOperations.apply(flowVersion, {
            type: FlowOperationType.UPDATE_TRIGGER,
            request: {
                type: FlowTriggerType.PIECE,
                name: trigger.name,
                displayName: trigger.displayName,
                valid: trigger.valid,
                settings: {
                    ...trigger.settings,
                    pieceName: 'webhook',
                    triggerName: 'catch_webhook',
                },
            },
        })
        const updated = getTrigger(result)
        expect(updated.lastUpdatedDate).not.toBe(TRIGGER_LAST_UPDATED)
    })
    it('CLAIM 8: UPDATE_ACTION rename with form-normalized empty option objects is still rename-only', () => {
        const flowVersion = createFlowVersion()
        const action = getAction(flowVersion)
        const result = flowOperations.apply(flowVersion, {
            type: FlowOperationType.UPDATE_ACTION,
            request: {
                type: FlowActionType.PIECE,
                name: action.name,
                displayName: 'Get Renamed',
                valid: action.valid,
                settings: {
                    ...action.settings,
                    errorHandlingOptions: {
                        continueOnFailure: {},
                        retryOnFailure: {},
                    },
                },
            },
        })
        const updated = getAction(result)
        expect(updated.lastUpdatedDate).toBe(ACTION_LAST_UPDATED)
        expect(updated.settings.sampleData?.sampleDataFileId).toBe(ACTION_SAMPLE_FILE_ID)
    })
})
