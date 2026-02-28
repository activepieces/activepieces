import { FlowActionKind, FlowTriggerKind, FlowVersion } from '@activepieces/shared'
import { legacyFlowStructureUtil } from './legacy-flow-structure-util'

export const flowMigrationUtil = {
    pinPieceToVersion(flowVersion: FlowVersion, pieceName: string, pieceVersion: string) {
        const newVersion = legacyFlowStructureUtil.transferFlow(flowVersion, (step) => {
            if ((step.type === FlowActionKind.PIECE || step.type === FlowTriggerKind.PIECE) && step.settings.pieceName === pieceName) {
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