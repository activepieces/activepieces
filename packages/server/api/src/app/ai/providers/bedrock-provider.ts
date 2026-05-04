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
    ListInferenceProfilesCommand,
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

        const [foundationResponse, profileByModelArn] = await Promise.all([
            client.send(new ListFoundationModelsCommand({})),
            listSystemInferenceProfiles(client),
        ])

        const summaries = foundationResponse.modelSummaries ?? []

        const models = summaries
            .filter(
                (m) => !!m.modelId && m.modelLifecycle?.status === 'ACTIVE',
            )
            .map((m) => {
                const outputs = m.outputModalities ?? []
                const isImage = outputs.includes(ModelModality.IMAGE)
                const isText = outputs.includes(ModelModality.TEXT)

                const foundationId = m.modelId as string
                const profileId = m.modelArn ? profileByModelArn.get(m.modelArn) : undefined
                const invocationId = profileId ?? foundationId
                const displayName = m.modelName ?? foundationId

                if (isImage) {
                    return {
                        id: invocationId,
                        name: displayName,
                        type: AIProviderModelType.IMAGE,
                    }
                }

                if (isText && m.responseStreamingSupported === true) {
                    return {
                        id: invocationId,
                        name: displayName,
                        type: AIProviderModelType.TEXT,
                    }
                }

                return null
            })
            .filter((m) => !isNil(m)) as AIProviderModel[]

        return models
    },
}

async function listSystemInferenceProfiles(client: BedrockClient): Promise<Map<string, string>> {
    const profileByModelArn = new Map<string, string>()
    try {
        const response = await client.send(new ListInferenceProfilesCommand({
            typeEquals: 'SYSTEM_DEFINED',
        }))
        for (const profile of response.inferenceProfileSummaries ?? []) {
            if (profile.status !== 'ACTIVE' || !profile.inferenceProfileId) continue
            for (const model of profile.models ?? []) {
                if (model.modelArn && !profileByModelArn.has(model.modelArn)) {
                    profileByModelArn.set(model.modelArn, profile.inferenceProfileId)
                }
            }
        }
    }
    catch {
        // Missing bedrock:ListInferenceProfiles permission falls through to foundation IDs.
    }
    return profileByModelArn
}
