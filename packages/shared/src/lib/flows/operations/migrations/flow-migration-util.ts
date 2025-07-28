import { ActionType } from '../../actions/action'
import { FlowVersion } from '../../flow-version'
import { TriggerType } from '../../triggers/trigger'
import { flowStructureUtil } from '../../util/flow-structure-util'


export const flowMigrationUtil = {
    pinPieceToVersion(flowVersion: FlowVersion, pieceName: string, pieceVersion: string) {
        const newVersion = flowStructureUtil.transferFlow(flowVersion, (step) => {
            if ((step.type === ActionType.PIECE || step.type === TriggerType.PIECE) && step.settings.pieceName === pieceName) {
                return {
                    ...step,
                    settings: {
                        ...step.settings,
                        pieceVersion,
                    },
                }
            }
            return step
        })
        return newVersion
    },
}