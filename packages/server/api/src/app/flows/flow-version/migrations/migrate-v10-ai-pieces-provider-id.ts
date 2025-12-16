import {
    AIProviderName,
    FlowActionType,
    flowStructureUtil,
    FlowVersion,
} from '@activepieces/shared'
import { Migration } from '.'
import { databaseConnection } from '../../../database/database-connection'


export const migrateV10AiPiecesProviderId: Migration = {
    targetSchemaVersion: '10',
    migrate: async (flowVersion: FlowVersion): Promise<FlowVersion> => {
        const db = databaseConnection()

        const [platform] = await db.query<{ platformId: string }[]>(`
            SELECT p.platformId AS platformId
            FROM flow f
            JOIN project p ON p.id = f.projectId    
            WHERE f.id = $1
        `, [flowVersion.flowId])
        const aiProviders = await db.query<{ id: string; provider: string }[]>(`
            SELECT id, provider
            FROM ai_provider 
            WHERE "platformId" = $1 
            ORDER BY "created" ASC
        `, [platform.platformId])

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

            const isLegacyProviderId = Object.values(AIProviderName).includes(provider as AIProviderName);
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


