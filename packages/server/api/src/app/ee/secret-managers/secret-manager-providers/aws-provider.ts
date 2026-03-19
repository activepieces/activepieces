import { ActivepiecesError, AWSProviderConfig, ErrorCode, isNil, isObject, isString, SecretManagerProviderId } from '@activepieces/shared'
import { GetSecretValueCommand, ListSecretsCommand, SecretsManagerClient } from '@aws-sdk/client-secrets-manager'
import { FastifyBaseLogger } from 'fastify'
import { SecretManagerProvider, throwConnectionError, throwGetSecretError } from './secret-manager-providers'

function getSecretsManagerClient(config: AWSProviderConfig): SecretsManagerClient {
    return new SecretsManagerClient({
        region: config.region,
        credentials: {
            accessKeyId: config.accessKeyId,
            secretAccessKey: config.secretAccessKey,
        },
    })
}

export const awsProvider = (log: FastifyBaseLogger): SecretManagerProvider<SecretManagerProviderId.AWS> => ({
    checkConnection: async (config) => {
        try {
            const client = getSecretsManagerClient(config)
            await client.send(new ListSecretsCommand({ MaxResults: 1 }))
            return true
        }
        catch (error: unknown) {
            throwConnectionError({ error, provider: SecretManagerProviderId.AWS, log })
        }
    },
    connect: async (config) => {
        await awsProvider(log).checkConnection(config)
    },
    disconnect: async () => {
        return Promise.resolve()
    },
    getSecret: async (request, config) => {
        const { secretName, secretJsonKey } = validatePathFormat(request.path)

        try {
            const client = getSecretsManagerClient(config)
            const response = await client.send(new GetSecretValueCommand({
                SecretId: secretName,
            }))

            const secret = response.SecretString
            if (!secret) {
                throw new Error('Secret value is empty or binary (binary secrets are not supported)')
            }

            const parsedSecretJson = JSON.parse(secret)
            if (!isObject(parsedSecretJson)) {
                throw new Error('Unexpected secret response from AWS')
            }
            
            const value = parsedSecretJson[secretJsonKey]
            if (isNil(value) || !isString(value)) {
                throw new Error(`Secret value for key ${secretJsonKey} not found`)
            }

            return value
        }
        catch (error: unknown) {
            if (error instanceof ActivepiecesError) throw error
            throwGetSecretError({ error, path: request.path, provider: SecretManagerProviderId.AWS, request, log })
        }
    },

})
// secretParam has path which is in the format of secretName:secretJsonKey
const validatePathFormat = (path: string): { secretName: string, secretJsonKey: string } => {
    const separatorIndex = path.indexOf(':')
    if (separatorIndex === -1) {
        throw new ActivepiecesError({
            code: ErrorCode.VALIDATION,
            params: {
                message: `Wrong key format. Should be secretName:secretJsonKey, got ${path}`,
            },
        })
    }
    return {
        secretName: path.slice(0, separatorIndex),
        secretJsonKey: path.slice(separatorIndex + 1),
    }
}
