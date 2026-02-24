import {  AWSProviderConfig, GetSecretManagerSecretRequest, SecretManagerProviderId, SecretManagerProviderMetaData } from '@activepieces/ee-shared'
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
            type: 'text',
        },
        secretAccessKey: {
            displayName: 'Secret Access Key',
            placeholder: 'secretAccessKey',
            type: 'password',
        },
    },
    getSecretParams: {
        path: {
            displayName: 'Secret Path',
            placeholder: 'secretPath',
            type: 'text',
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
    getSecret: async (_request: GetSecretManagerSecretRequest, _config: AWSProviderConfig) => {
        return Promise.resolve('secret')
    },
    validatePathFormat: async (_: string) => {
     
    },
})
