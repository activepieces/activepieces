import { AWSGetSecretRequest, AWSProviderConfig, SecretManagerProviderId, SecretManagerProviderMetaData } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { SecretManagerProvider } from './secret-manager-providers'


export const AWS_PROVIDER_METADATA: SecretManagerProviderMetaData = {
    id: SecretManagerProviderId.AWS,
    name: 'AWS',
    logo: 'https://www.aws.com/logo.png',
    fields: {
        accessKeyId: {
            displayName: 'Access Key ID',
            placeholder: 'accessKeyId',
        },
        secretAccessKey: {
            displayName: 'Secret Access Key',
            placeholder: 'secretAccessKey',
        },
    },
    getSecretParams: {
        secretPath: {
            displayName: 'Secret Path',
            placeholder: 'secretPath',
        },
    },
}

export const awsProvider = (_log: FastifyBaseLogger): SecretManagerProvider<SecretManagerProviderId.AWS> => ({
    checkConnection: async (_config) => {
   
        return Promise.resolve(true)
    },
    connect: async (_config) => {
        return Promise.resolve()
    },
    disconnect: async () => {
        return Promise.resolve()
    },
    getSecret: async (_request: AWSGetSecretRequest, _config: AWSProviderConfig) => {
        return Promise.resolve('secret')
    },
    resolve: async (key: string) => {
        return {
            secretPath: key,
        }
    },
})
