import { isNil } from '@activepieces/core-utils'
import { FlowActionType } from '../actions/action'
import { EMBED_CONSTRAINTS_METADATA_KEY, EmbedConstraints, Flow } from '../flow'
import { FlowVersion } from '../flow-version'
import { FlowTriggerType } from '../triggers/trigger'
import { flowStructureUtil } from './flow-structure-util'

const SUBFLOWS_PIECE_NAME = '@activepieces/piece-subflows'

function isSubflow(version: FlowVersion): boolean {
    return version.trigger.type === FlowTriggerType.PIECE
        && version.trigger.settings.pieceName === SUBFLOWS_PIECE_NAME
}

function getEmbedConstraints(flow: Pick<Flow, 'metadata'>): EmbedConstraints | undefined {
    const raw = flow.metadata?.[EMBED_CONSTRAINTS_METADATA_KEY]
    if (isNil(raw)) {
        return undefined
    }
    const parsed = EmbedConstraints.safeParse(raw)
    return parsed.success ? parsed.data : undefined
}

function flowSatisfiesRequiredPiece({ version, constraints }: { version: FlowVersion, constraints: EmbedConstraints | undefined }): boolean {
    const required = constraints?.requiredPieceNames
    if (isNil(required) || required.length === 0) {
        return true
    }
    if (isSubflow(version)) {
        return true
    }
    return flowStructureUtil.getAllSteps(version.trigger).some((step) => {
        if (step.type === FlowTriggerType.PIECE) {
            return required.includes(step.settings.pieceName)
        }
        if (step.type === FlowActionType.PIECE) {
            return step.skip !== true && required.includes(step.settings.pieceName)
        }
        return false
    })
}

export const embedConstraintsUtil = {
    isSubflow,
    getEmbedConstraints,
    flowSatisfiesRequiredPiece,
}
