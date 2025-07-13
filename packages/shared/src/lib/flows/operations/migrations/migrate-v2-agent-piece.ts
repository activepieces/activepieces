import { FlowVersion } from '../../flow-version'
import { flowStructureUtil } from '../../util/flow-structure-util'
import { Migration } from '.'

export const migrateAgentPiece: Migration = {
    name: 'migrate-v2-agent-piece-to-2.0.0',
    migrate: (flowVersion: FlowVersion): FlowVersion => {
        if (flowVersion.schemaVersion === '2') {
            const newVersion = flowStructureUtil.transferFlow(flowVersion, (step) => {
                if ((step.type === 'PIECE' || step.type === 'PIECE_TRIGGER') && step.settings.pieceName === '@activepieces/piece-agent') {
                    const pieceStep = step
                    pieceStep.settings.pieceVersion = '0.2.0'
                    return pieceStep
                }
                return step
            })
            return {
                ...newVersion,
                schemaVersion: '3',
            }
        }
        return flowVersion
    },
} 