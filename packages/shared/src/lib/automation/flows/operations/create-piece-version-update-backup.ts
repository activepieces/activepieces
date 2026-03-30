import { FlowActionType } from '../actions/action'
import { FlowVersion } from '../flow-version'
import { FlowTriggerType } from '../triggers/trigger'
import { flowStructureUtil } from '../util/flow-structure-util'
import { CreatePieceVersionUpdateBackupRequest } from './index'

function _createPieceVersionUpdateBackup(
    flowVersion: FlowVersion,
    request: CreatePieceVersionUpdateBackupRequest,
): FlowVersion {
    const step = flowStructureUtil.getStep(request.stepName, flowVersion.trigger)
    if (step === undefined) {
        return flowVersion
    }
    if (step.type !== FlowActionType.PIECE && step.type !== FlowTriggerType.PIECE) {
        return flowVersion
    }
    const pieceName = step.settings.pieceName
    const pieceVersion = step.settings.pieceVersion
    const actionOrTriggerName =
        step.type === FlowTriggerType.PIECE
            ? (step.settings.triggerName ?? '')
            : (step.settings.actionName ?? '')
    const existing = flowVersion.pieceStepsVersionsBackups ?? {}
    return {
        ...flowVersion,
        pieceStepsVersionsBackups: {
            ...existing,
            [request.stepName]: {
                pieceName,
                pieceVersion,
                actionOrTriggerName,
                fileId: '',
            },
        },
    }
}

export { _createPieceVersionUpdateBackup }
