import {
    EmbedConstraints,
    embedConstraintsUtil,
    FlowAction,
    FlowActionType,
    FlowTrigger,
    FlowTriggerType,
    FlowVersion,
    FlowVersionState,
    PropertyExecutionType,
} from '../../src'

const REQUIRED_PIECE = '@activepieces/piece-example'
const OTHER_PIECE = '@activepieces/piece-slack'
const SUBFLOWS_PIECE = '@activepieces/piece-subflows'

function pieceAction({ name, pieceName, skip }: { name: string, pieceName: string, skip?: boolean }): FlowAction {
    return {
        name,
        type: FlowActionType.PIECE,
        displayName: name,
        valid: true,
        skip,
        settings: {
            pieceName,
            pieceVersion: '0.0.1',
            actionName: 'someAction',
            input: {},
            propertySettings: {},
            errorHandlingOptions: {
                continueOnFailure: { value: false },
                retryOnFailure: { value: false },
            },
        },
    }
}

function pieceTrigger({ pieceName, nextAction }: { pieceName: string, nextAction?: FlowAction }): FlowTrigger {
    return {
        name: 'trigger',
        type: FlowTriggerType.PIECE,
        displayName: 'trigger',
        valid: true,
        nextAction,
        settings: {
            pieceName,
            pieceVersion: '0.0.1',
            triggerName: 'someTrigger',
            input: {},
            propertySettings: {
                cronExpression: { type: PropertyExecutionType.MANUAL },
            },
        },
    }
}

function emptyTrigger({ nextAction }: { nextAction?: FlowAction }): FlowTrigger {
    return {
        name: 'trigger',
        type: FlowTriggerType.EMPTY,
        displayName: 'trigger',
        valid: false,
        nextAction,
        settings: {},
    }
}

function flowVersion({ trigger }: { trigger: FlowTrigger }): FlowVersion {
    return {
        id: 'version-1',
        created: '2024-01-01T00:00:00.000Z',
        updated: '2024-01-01T00:00:00.000Z',
        flowId: 'flow-1',
        displayName: 'Test Flow',
        trigger,
        updatedBy: null,
        valid: true,
        schemaVersion: '22',
        agentIds: [],
        state: FlowVersionState.DRAFT,
        connectionIds: [],
        backupFiles: null,
        notes: [],
    }
}

describe('embedConstraintsUtil.flowSatisfiesRequiredPiece', () => {
    const constraints: EmbedConstraints = { requiredPieceNames: [REQUIRED_PIECE] }

    it('returns true when there are no constraints', () => {
        const version = flowVersion({ trigger: pieceTrigger({ pieceName: OTHER_PIECE }) })
        expect(embedConstraintsUtil.flowSatisfiesRequiredPiece({ version, constraints: undefined })).toBe(true)
    })

    it('returns true when the required list is empty', () => {
        const version = flowVersion({ trigger: pieceTrigger({ pieceName: OTHER_PIECE }) })
        expect(embedConstraintsUtil.flowSatisfiesRequiredPiece({ version, constraints: { requiredPieceNames: [] } })).toBe(true)
    })

    it('returns true when the trigger uses the required piece', () => {
        const version = flowVersion({ trigger: pieceTrigger({ pieceName: REQUIRED_PIECE }) })
        expect(embedConstraintsUtil.flowSatisfiesRequiredPiece({ version, constraints })).toBe(true)
    })

    it('returns true when a non-skipped action uses the required piece', () => {
        const version = flowVersion({
            trigger: pieceTrigger({
                pieceName: OTHER_PIECE,
                nextAction: pieceAction({ name: 'step_1', pieceName: REQUIRED_PIECE }),
            }),
        })
        expect(embedConstraintsUtil.flowSatisfiesRequiredPiece({ version, constraints })).toBe(true)
    })

    it('returns false when the required piece is only in a skipped action', () => {
        const version = flowVersion({
            trigger: pieceTrigger({
                pieceName: OTHER_PIECE,
                nextAction: pieceAction({ name: 'step_1', pieceName: REQUIRED_PIECE, skip: true }),
            }),
        })
        expect(embedConstraintsUtil.flowSatisfiesRequiredPiece({ version, constraints })).toBe(false)
    })

    it('returns false when no step uses the required piece', () => {
        const version = flowVersion({
            trigger: pieceTrigger({
                pieceName: OTHER_PIECE,
                nextAction: pieceAction({ name: 'step_1', pieceName: OTHER_PIECE }),
            }),
        })
        expect(embedConstraintsUtil.flowSatisfiesRequiredPiece({ version, constraints })).toBe(false)
    })

    it('is satisfied if any piece from the set is present', () => {
        const multi: EmbedConstraints = { requiredPieceNames: [REQUIRED_PIECE, '@activepieces/piece-example-two'] }
        const version = flowVersion({
            trigger: pieceTrigger({
                pieceName: OTHER_PIECE,
                nextAction: pieceAction({ name: 'step_1', pieceName: '@activepieces/piece-example-two' }),
            }),
        })
        expect(embedConstraintsUtil.flowSatisfiesRequiredPiece({ version, constraints: multi })).toBe(true)
    })

    it('exempts subflows regardless of required piece', () => {
        const version = flowVersion({ trigger: pieceTrigger({ pieceName: SUBFLOWS_PIECE }) })
        expect(embedConstraintsUtil.flowSatisfiesRequiredPiece({ version, constraints })).toBe(true)
    })

    it('returns false for an empty trigger with no required piece present', () => {
        const version = flowVersion({ trigger: emptyTrigger({}) })
        expect(embedConstraintsUtil.flowSatisfiesRequiredPiece({ version, constraints })).toBe(false)
    })
})

describe('embedConstraintsUtil.getEmbedConstraints', () => {
    it('returns undefined when metadata is missing', () => {
        expect(embedConstraintsUtil.getEmbedConstraints({ metadata: null })).toBeUndefined()
    })

    it('parses embedConstraints from metadata', () => {
        const constraints = embedConstraintsUtil.getEmbedConstraints({
            metadata: { embedConstraints: { requiredPieceNames: [REQUIRED_PIECE], triggerLock: 'locked' } },
        })
        expect(constraints).toEqual({ requiredPieceNames: [REQUIRED_PIECE], triggerLock: 'locked' })
    })

    it('returns undefined for malformed embedConstraints', () => {
        expect(embedConstraintsUtil.getEmbedConstraints({
            metadata: { embedConstraints: { triggerLock: 'not-a-mode' } },
        })).toBeUndefined()
    })
})

describe('embedConstraintsUtil.isSubflow', () => {
    it('detects the subflows trigger piece', () => {
        expect(embedConstraintsUtil.isSubflow(flowVersion({ trigger: pieceTrigger({ pieceName: SUBFLOWS_PIECE }) }))).toBe(true)
        expect(embedConstraintsUtil.isSubflow(flowVersion({ trigger: pieceTrigger({ pieceName: OTHER_PIECE }) }))).toBe(false)
    })
})
