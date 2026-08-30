import { AIProviderModel, tryCatch, tryCatchSync, VertexProviderAuthConfig, VertexProviderConfig } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { GoogleAuth } from 'google-auth-library'
import { AIProviderStrategy } from './ai-provider'

export const vertexProvider: AIProviderStrategy<VertexProviderAuthConfig, VertexProviderConfig> = {
    name: 'Google Vertex AI',

    async validateConnection(
        authConfig: VertexProviderAuthConfig,
        config: VertexProviderConfig,
        _log: FastifyBaseLogger,
    ): Promise<void> {
        const credentials = parseServiceAccount(authConfig.serviceAccountJson)

        const { data: token, error } = await tryCatch(() => new GoogleAuth({
            credentials,
            projectId: config.project,
            scopes: [CLOUD_PLATFORM_SCOPE],
        }).getAccessToken())

        if (error) {
            throw new Error(`Failed to authenticate the Vertex AI service account: ${error instanceof Error ? error.message : String(error)}`)
        }
        if (!token) {
            throw new Error('Vertex AI service account returned no access token')
        }
    },

    async listModels(_authConfig: VertexProviderAuthConfig, config: VertexProviderConfig): Promise<AIProviderModel[]> {
        return config.models.map((model) => ({
            id: model.modelId,
            name: model.modelName,
            type: model.modelType,
        }))
    },
}

function parseServiceAccount(serviceAccountJson: string): ServiceAccountCredentials {
    const { data: parsed, error } = tryCatchSync(() => JSON.parse(serviceAccountJson))
    if (error) {
        throw new Error('Service account JSON is not valid JSON — paste the whole key file')
    }
    if (!isServiceAccount(parsed)) {
        throw new Error('Service account JSON must have type "service_account" with project_id, client_email and private_key')
    }
    return {
        type: parsed.type,
        project_id: parsed.project_id,
        client_email: parsed.client_email,
        private_key: parsed.private_key.replace(/\\n/g, '\n'),
    }
}

function isServiceAccount(value: unknown): value is ServiceAccountCredentials {
    if (typeof value !== 'object' || value === null) {
        return false
    }
    const candidate: Record<string, unknown> = { ...value }
    return candidate['type'] === 'service_account'
        && typeof candidate['project_id'] === 'string'
        && typeof candidate['client_email'] === 'string'
        && typeof candidate['private_key'] === 'string'
}

const CLOUD_PLATFORM_SCOPE = 'https://www.googleapis.com/auth/cloud-platform'

type ServiceAccountCredentials = {
    type: string
    project_id: string
    client_email: string
    private_key: string
}
