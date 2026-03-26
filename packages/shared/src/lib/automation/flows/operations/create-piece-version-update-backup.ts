import { FlowActionType } from '../actions/action'
import { FlowVersion } from '../flow-version'
import { FlowTriggerType } from '../triggers/trigger'
import { flowStructureUtil } from '../util/flow-structure-util'
import { CreatePieceVersionUpdateBackupRequest } from './index'

function _createPieceVersionUpdateBackup(
    flowVersion: FlowVersion,
    request: CreatePieceVersionUpdateBackupRequest,
): FlowVersion {
    return flowStructureUtil.transferFlow(flowVersion, (step) => {
        if (step.name !== request.stepName) {
            return step
        }
        if (step.type === FlowActionType.PIECE) {
            const { versionUpdateBackup: _existing, ...backup } = step.settings
            return {
                ...step,
                settings: { ...step.settings, versionUpdateBackup: backup },
            }
        }
        if (step.type === FlowTriggerType.PIECE) {
            const { versionUpdateBackup: _existing, ...backup } = step.settings
            return {
                ...step,
                settings: { ...step.settings, versionUpdateBackup: backup },
            }
        }
        return step
    })
}

export { _createPieceVersionUpdateBackup }
