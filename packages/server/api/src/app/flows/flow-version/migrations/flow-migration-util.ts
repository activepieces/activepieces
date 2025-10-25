import { FlowActionType, flowStructureUtil, FlowTriggerType, FlowVersion } from '@activepieces/shared'

export const flowMigrationUtil = {
    pinPieceToVersion(flowVersion: FlowVersion, pieceName: string, pieceVersion: string) {
        const newVersion = flowStructureUtil.transferFlow(flowVersion, (step) => {
            if ((step.type === FlowActionType.PIECE || step.type === FlowTriggerType.PIECE) && step.settings.pieceName === pieceName) {
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