import { ActivepiecesError, AWSProviderConfig, ErrorCode, isNil, isObject, isString, SecretManagerProviderId, SecretManagerProviderMetaData } from '@activepieces/shared'
import { GetSecretValueCommand, ListSecretsCommand, SecretsManagerClient } from '@aws-sdk/client-secrets-manager'
import { FastifyBaseLogger } from 'fastify'
import { SecretManagerProvider } from './secret-manager-providers'

export const AWS_PROVIDER_METADATA: SecretManagerProviderMetaData = {
    id: SecretManagerProviderId.AWS,
    name: 'AWS Secrets Manager',
    logo: 'https://cdn.activepieces.com/pieces/amazon-secrets-manager.png',
    fields: {
        accessKeyId: {
            displayName: 'Access Key ID',
            placeholder: 'access-key',
            type: 'text',
        },
        secretAccessKey: {
            displayName: 'Secret Access Key',
            placeholder: 'secret-key',
            type: 'password',
        },
        region: {
            displayName: 'Region',
            placeholder: 'us-east-1',
            type: 'text',
        },
    },
    secretParams: {
        path: {
            displayName: 'Secret Path',
            placeholder: 'secret-name:secret-json-key',
            type: 'text',
        },
    },
}


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
            const message = error instanceof Error ? error.message : 'Unknown error'
            log.error({
                message,
                provider: SecretManagerProviderId.AWS,
            }, '[awsProvider#checkConnection]')
            throw new ActivepiecesError({
                code: ErrorCode.SECRET_MANAGER_CONNECTION_FAILED,
                params: {
                    message,
                    provider: SecretManagerProviderId.AWS,
                },
            })
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
            if (error instanceof ActivepiecesError) {
                throw error
            }
            const message = error instanceof Error ? error.message : 'Unknown error'
            log.error({
                message,
                provider: SecretManagerProviderId.AWS,
                request: { secretName },
            }, '[awsProvider#getSecret]')
            throw new ActivepiecesError({
                code: ErrorCode.SECRET_MANAGER_GET_SECRET_FAILED,
                params: {
                    message,
                    provider: SecretManagerProviderId.AWS,
                    request,
                },
            })
        }
    },

})

const validatePathFormat = (path: string): { secretName: string, secretJsonKey: string } => {
    const colonIndex = path.indexOf(':')
    if (colonIndex === -1) {
        throw new ActivepiecesError({
            code: ErrorCode.VALIDATION,
            params: {
                message: 'Wrong key format. Should be secretName:secretJsonKey',
            },
        })
    }
    return {
        secretName: path.slice(0, colonIndex),
        secretJsonKey: path.slice(colonIndex + 1),
    }
}
