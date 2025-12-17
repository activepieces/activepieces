import {
    AIProviderName,
    FlowActionType,
    flowStructureUtil,
    FlowVersion,
} from '@activepieces/shared'
import { databaseConnection } from '../../../database/database-connection'
import { Migration } from '.'
import { flowRepo } from '../../flow/flow.repo'
import { FlowEntity } from '../../flow/flow.entity'


export const migrateV10AiPiecesProviderId: Migration = {
    targetSchemaVersion: '10',
    migrate: async (flowVersion: FlowVersion): Promise<FlowVersion> => {
        const db = databaseConnection()

        const aiProviders = await flowRepo()
            .createQueryBuilder('flow')
            .innerJoin('flow.project', 'project')
            .innerJoin(
                'ai_provider',
                'aiProvider',
                'aiProvider.platformId = project.platformId'
            )
            .where('flow.id = :flowId', { flowId: flowVersion.flowId })
            .select([
                'aiProvider.id AS id',
                'aiProvider.provider AS provider',
            ])
            .orderBy('aiProvider.created', 'ASC')
            .getRawMany<{ id: string; provider: string }>();

        const newVersion = flowStructureUtil.transferFlow(flowVersion, (step) => {
            if (step.type !== FlowActionType.PIECE) {
                return step
            }
            if (step.settings.pieceName !== '@activepieces/piece-ai') {
                return step
            }

            const input = step.settings?.input as Record<string, unknown>
            const provider = input.provider as string | undefined
            if (!provider) {
                return step
            }

            const isLegacyProviderId = Object.values(AIProviderName).includes(provider as AIProviderName)
            if (!isLegacyProviderId) {
                return step
            }
            if (provider === AIProviderName.ACTIVEPIECES) {
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


