import { AI_PIECE_COST_BILLING_VERSION, AI_PIECE_NAME, FlowActionType, flowStructureUtil, FlowVersion } from '@activepieces/shared'
import semver from 'semver'
import { Migration } from '.'

export const migrateV26AiPieceCostBilling: Migration = {
    targetSchemaVersion: '26',
    migrate: async (flowVersion: FlowVersion): Promise<FlowVersion> => {
        const newVersion = flowStructureUtil.transferFlow(flowVersion, (step) => {
            if (step.type !== FlowActionType.PIECE || step.settings.pieceName !== AI_PIECE_NAME) {
                return step
            }
            if (!isBelowCostBillingVersion(step.settings.pieceVersion)) {
                return step
            }
            return {
                ...step,
                settings: {
                    ...step.settings,
                    pieceVersion: AI_PIECE_COST_BILLING_VERSION,
                },
            }
        })
        return { ...newVersion, schemaVersion: '27' }
    },
}

function isBelowCostBillingVersion(pieceVersion: string): boolean {
    const current = semver.coerce(pieceVersion)
    if (current === null) {
        return true
    }
    return semver.lt(current, AI_PIECE_COST_BILLING_VERSION)
}

