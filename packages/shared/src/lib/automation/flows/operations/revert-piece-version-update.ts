import { isNil } from '../../../core/common'
import { FlowActionType } from '../actions/action'
import { FlowVersion } from '../flow-version'
import { FlowTriggerType } from '../triggers/trigger'
import { flowStructureUtil } from '../util/flow-structure-util'
import { RevertPieceVersionUpdateRequest } from './index'

function _revertPieceVersionUpdate(
    flowVersion: FlowVersion,
    request: RevertPieceVersionUpdateRequest,
): FlowVersion {
    return flowStructureUtil.transferFlow(flowVersion, (step) => {
        if (step.name !== request.stepName) {
            return step
        }
        if (step.type === FlowActionType.PIECE) {
            const backup = step.settings.versionUpdateBackup
            if (!isNil(backup)) {
                return {
                    ...step,
                    settings: { ...backup, versionUpdateBackup: undefined },
                }
            }
        }
        if (step.type === FlowTriggerType.PIECE) {
            const backup = step.settings.versionUpdateBackup
            if (!isNil(backup)) {
                return {
                    ...step,
                    settings: { ...backup, versionUpdateBackup: undefined },
                }
            }
        }
        return step
    })
}

export { _revertPieceVersionUpdate }
