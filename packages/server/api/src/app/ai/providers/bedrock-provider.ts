import { AIProviderModel, AIProviderModelType, BedrockProviderAuthConfig, BedrockProviderConfig } from '@activepieces/shared'
import { BedrockClient, ListFoundationModelsCommand, ModelModality } from '@aws-sdk/client-bedrock'
import { FastifyBaseLogger } from 'fastify'
import { AIProviderStrategy } from './ai-provider'

export const bedrockProvider: AIProviderStrategy<BedrockProviderAuthConfig, BedrockProviderConfig> = {
    name: 'AWS Bedrock',
    async validateConnection(authConfig: BedrockProviderAuthConfig, config: BedrockProviderConfig, _log: FastifyBaseLogger): Promise<void> {
        await bedrockProvider.listModels(authConfig, config)
    },
    async listModels(authConfig: BedrockProviderAuthConfig, config: BedrockProviderConfig): Promise<AIProviderModel[]> {
        const client = new BedrockClient({
            region: config.region,
            credentials: {
                accessKeyId: authConfig.accessKeyId,
                secretAccessKey: authConfig.secretAccessKey,
            },
        })

        const response = await client.send(new ListFoundationModelsCommand({
            byInferenceType: 'ON_DEMAND',
        }))

        const summaries = response.modelSummaries ?? []

        return summaries
            .filter((m) => !!m.modelId)
            .map((m) => ({
                id: m.modelId as string,
                name: m.modelName ?? (m.modelId as string),
                type: (m.outputModalities ?? []).includes(ModelModality.IMAGE) ? AIProviderModelType.IMAGE : AIProviderModelType.TEXT,
            }))
    },
}
