import {
    AIProviderModel,
    AIProviderModelType,
    BedrockProviderAuthConfig,
    BedrockProviderConfig,
    isNil,
} from '@activepieces/shared'

import {
    BedrockClient,
    ListFoundationModelsCommand,
    ModelModality,
} from '@aws-sdk/client-bedrock'

import { FastifyBaseLogger } from 'fastify'
import { AIProviderStrategy } from './ai-provider'

export const bedrockProvider: AIProviderStrategy<
BedrockProviderAuthConfig,
BedrockProviderConfig
> = {
    name: 'AWS Bedrock',

    async validateConnection(
        authConfig: BedrockProviderAuthConfig,
        config: BedrockProviderConfig,
        _log: FastifyBaseLogger,
    ): Promise<void> {
        await bedrockProvider.listModels(authConfig, config)
    },

    async listModels(
        authConfig: BedrockProviderAuthConfig,
        config: BedrockProviderConfig,
    ): Promise<AIProviderModel[]> {
        const client = new BedrockClient({
            region: config.region,
            credentials: {
                accessKeyId: authConfig.accessKeyId,
                secretAccessKey: authConfig.secretAccessKey,
            },
        })

        const response = await client.send(
            new ListFoundationModelsCommand({}),
        )

        const summaries = response.modelSummaries ?? []

        const models = summaries
            .filter(
                (m) => !!m.modelId && m.modelLifecycle?.status === 'ACTIVE',
            )
            .map((m) => {
                const outputs = m.outputModalities ?? []
                const isImage = outputs.includes(ModelModality.IMAGE)
                const isText = outputs.includes(ModelModality.TEXT)

                if (isImage) {
                    return {
                        id: m.modelId,
                        name: m.modelName ?? m.modelId,
                        type: AIProviderModelType.IMAGE,
                    }
                }

                if (isText && m.responseStreamingSupported === true) {
                    return {
                        id: m.modelId,
                        name: m.modelName ?? m.modelId,
                        type: AIProviderModelType.TEXT,
                    }
                }

                return null
            })
            .filter((m) => !isNil(m)) as AIProviderModel[]

        return models
    },
}