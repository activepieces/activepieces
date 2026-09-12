import { AgentPieceProps, AI_PIECE_COST_BILLING_VERSION, AI_PIECE_NAME, FlowActionType, flowStructureUtil, FlowVersion } from '@activepieces/shared'
import semver from 'semver'
import { Migration } from '.'

export const migrateV26AiPieceCostBilling: Migration = {
    targetSchemaVersion: '26',
    migrate: async (flowVersion: FlowVersion): Promise<FlowVersion> => {
        const newVersion = flowStructureUtil.transferFlow(flowVersion, (step) => {
            if (step.type !== FlowActionType.PIECE || step.settings.pieceName !== AI_PIECE_NAME) {
                return step
            }
            return {
                ...step,
                settings: {
                    ...step.settings,
                    pieceVersion: isBelowCostBillingVersion(step.settings.pieceVersion) ? AI_PIECE_COST_BILLING_VERSION : step.settings.pieceVersion,
                    input: withAgentMaxSteps({ actionName: step.settings.actionName, input: step.settings.input }),
                },
            }
        })
        return { ...newVersion, schemaVersion: '27' }
    },
}

function withAgentMaxSteps({ actionName, input }: { actionName?: string, input: Record<string, unknown> }): Record<string, unknown> {
    if (actionName !== AGENT_ACTION_NAME || typeof input[AgentPieceProps.MAX_STEPS] === 'number') {
        return input
    }
    return { ...input, [AgentPieceProps.MAX_STEPS]: DEFAULT_MAX_STEPS }
}

function isBelowCostBillingVersion(pieceVersion: string): boolean {
    const current = semver.coerce(pieceVersion)
    if (current === null) {
        return true
    }
    return semver.lt(current, AI_PIECE_COST_BILLING_VERSION)
}

const AGENT_ACTION_NAME = 'run_agent'
const DEFAULT_MAX_STEPS = 20
