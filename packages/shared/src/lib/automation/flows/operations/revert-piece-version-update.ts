import { FlowVersion } from '../flow-version'
import { RevertPieceVersionUpdateRequest } from './index'

// the actual reverting is done on server side
function _revertPieceVersionUpdate(
    flowVersion: FlowVersion,
    request: RevertPieceVersionUpdateRequest,
): FlowVersion {
    const backups = flowVersion.pieceStepsVersionsBackups ?? {}
    if (backups === undefined || backups[request.stepName] === undefined) {
        return flowVersion
    }
    const { [request.stepName]: _removed, ...rest } = backups
    return {
        ...flowVersion,
        pieceStepsVersionsBackups: Object.keys(rest).length > 0 ? rest : undefined,
    }
}

export { _revertPieceVersionUpdate }
