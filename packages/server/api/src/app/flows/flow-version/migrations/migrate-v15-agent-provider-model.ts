import {
    AgentPieceProps,
    FlowActionKind,
    FlowVersion,
} from '@activepieces/shared'
import { legacyFlowStructureUtil } from './legacy-flow-structure-util'
import { Migration } from '.'

export const migrateV15AgentProviderModel: Migration = {
    targetSchemaVersion: '15',
    migrate: async (flowVersion: FlowVersion): Promise<FlowVersion> => {
        const newVersion = legacyFlowStructureUtil.transferFlow(flowVersion, (step) => {
            if (step.type !== FlowActionKind.PIECE || step.settings.pieceName !== '@activepieces/piece-ai') {
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