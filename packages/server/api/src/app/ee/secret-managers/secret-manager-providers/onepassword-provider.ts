import { createClient } from '@1password/sdk'
import { ActivepiecesError, ErrorCode, OnePasswordProviderConfig, SecretManagerProviderId, SecretManagerProviderMetaData } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { SecretManagerProvider, throwConnectionError, throwGetSecretError } from './secret-manager-providers'

export const ONEPASSWORD_PROVIDER_METADATA: SecretManagerProviderMetaData = {
    id: SecretManagerProviderId.ONEPASSWORD,
    name: '1Password',
    logo: 'https://cdn.activepieces.com/pieces/1password.png',
    fields: {
        serviceAccountToken: {
            displayName: 'Service Account Token',
            placeholder: 'ops_...',
            type: 'text',
        },
    },
    secretParams: [
        {
            name: 'path',
            displayName: 'Secret Reference',
            placeholder: 'op://vault/item/field',
            type: 'text',
        },
    ],
}
async function buildClient(config: OnePasswordProviderConfig) {
    return createClient({
        auth: config.serviceAccountToken,
        integrationName: 'Activepieces',
        integrationVersion: 'v1.0.0',
    })
}

export const onePasswordProvider = (log: FastifyBaseLogger): SecretManagerProvider<SecretManagerProviderId.ONEPASSWORD> => ({
    checkConnection: async (config) => {
        try {
            const client = await buildClient(config)
            await client.vaults.list()
            return true
        }
        catch (error: unknown) {
            throwConnectionError({ error, provider: SecretManagerProviderId.ONEPASSWORD, log })
        }
    },
    connect: async (config) => {
        await onePasswordProvider(log).checkConnection(config)
    },
    disconnect: async () => {
        return Promise.resolve()
    },
    getSecret: async (request, config) => {
        validatePathFormat(request.path)
        try {
            const client = await buildClient(config)
            return await client.secrets.resolve(request.path)
        }
        catch (error: unknown) {
            if (error instanceof ActivepiecesError) throw error
            throwGetSecretError({ error, path: request.path, provider: SecretManagerProviderId.ONEPASSWORD, request, log })
        }
    },
})

const OP_REFERENCE_PATTERN = /^op:\/\/[^/]+\/[^/]+\/.+$/

function validatePathFormat(path: string): void {
    if (!OP_REFERENCE_PATTERN.test(path)) {
        throw new ActivepiecesError({
            code: ErrorCode.VALIDATION,
            params: {
                message: 'Wrong secret reference format. Expected: op://vault/item/field',
            },
        })
    }
}
