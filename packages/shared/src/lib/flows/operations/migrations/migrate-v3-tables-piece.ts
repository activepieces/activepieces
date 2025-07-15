import { FlowVersion } from '../../flow-version'
import { flowStructureUtil } from '../../util/flow-structure-util'
import { Migration } from '.'

export const migrateTablesPiece: Migration = {
    name: 'migrate-v3-tables-piece-to-0.2.0',
    migrate: (flowVersion: FlowVersion): FlowVersion => {
        if (flowVersion.schemaVersion === '3') {
            const newVersion = flowStructureUtil.transferFlow(flowVersion, (step) => {
                if ((step.type === 'PIECE' || step.type === 'PIECE_TRIGGER') && step.settings.pieceName === '@activepieces/piece-tables') {
                    const pieceStep = step
                    pieceStep.settings.pieceVersion = '0.2.0'
                    return pieceStep
                }
                return step
            })
            return {
                ...newVersion,
                schemaVersion: '4',
            }
        }
        return flowVersion
    },
} 