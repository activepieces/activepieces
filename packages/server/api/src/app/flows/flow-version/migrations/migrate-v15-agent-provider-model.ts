import {
    AgentPieceProps,
    FlowActionType,
    flowStructureUtil,
    FlowVersion,
} from '@activepieces/shared'
import { Migration } from '.'

export const migrateV15AgentProviderModel: Migration = {
    targetSchemaVersion: '15',
    migrate: async (flowVersion: FlowVersion): Promise<FlowVersion> => {
        const newVersion = flowStructureUtil.transferFlow(flowVersion, (step) => {
            if (step.type !== FlowActionType.PIECE || step.settings.pieceName !== '@activepieces/piece-ai') {
                return step
            }

            step.settings.pieceVersion = '0.1.0'

            if (step.settings.actionName === 'run_agent') {
                const input = step.settings.input as Record<string, unknown>

                const provider = input['provider'] as string
                const model = input['model'] as string

                step.settings.input = {
                    ...input,
                    [AgentPieceProps.AI_PROVIDER_MODEL]: { provider, model },
                }
            }

            return step
        })

        return {
            ...newVersion,
            schemaVersion: '16',
        }
    },
}