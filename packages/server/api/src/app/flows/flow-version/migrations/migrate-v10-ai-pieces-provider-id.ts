import {
    AIProviderName,
    FlowActionType,
    flowStructureUtil,
    FlowVersion,
} from '@activepieces/shared'
import { aiProviderService } from '../../../ai/ai-provider-service'
import { system } from '../../../helper/system/system'
import { flowRepo } from '../../flow/flow.repo'
import { Migration } from '.'


export const migrateV10AiPiecesProviderId: Migration = {
    targetSchemaVersion: '10',
    migrate: async (flowVersion: FlowVersion): Promise<FlowVersion> => {

        const { project } = await flowRepo().findOneOrFail({
            where: {
                id: flowVersion.flowId,
            },
            relations: ['project'],
        })
        const aiProviders = await aiProviderService(system.globalLogger()).listProviders(project.platformId)

        const newVersion = flowStructureUtil.transferFlow(flowVersion, (step) => {
            if (step.type !== FlowActionType.PIECE) {
                return step
            }
            if (step.settings.pieceName !== '@activepieces/piece-ai' && !['0.0.1', '0.0.2'].includes(step.settings.pieceVersion)) {
                return step
            }

            const input = step.settings?.input as Record<string, unknown>
            const provider = input.provider as string | undefined
            if (!provider) {
                return step
            }

            const providerExists = Object.values(AIProviderName).includes(provider as AIProviderName)
            if (!providerExists) {
                return step
            }

            const aiProvider = aiProviders.find(p => p.provider === provider)
            if (!aiProvider) {
                return step
            }

            return {
                ...step,
                settings: {
                    ...step.settings,
                    pieceName: '@activepieces/piece-ai',
                    pieceVersion: '0.0.3',
                    input: {
                        ...input,
                        provider: aiProvider.id,
                    },
                },
            }
        })

        return {
            ...newVersion,
            schemaVersion: '11',
        }
    },
}


