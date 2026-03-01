import { createClient } from '@1password/sdk'
import { ActivepiecesError, ErrorCode, OnePasswordProviderConfig, SecretManagerProviderId, SecretManagerProviderMetaData } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { SecretManagerProvider } from './secret-manager-providers'

export const ONEPASSWORD_PROVIDER_METADATA: SecretManagerProviderMetaData = {
    id: SecretManagerProviderId.ONEPASSWORD,
    name: '1Password',
    logo: 'https://cdn.activepieces.com/pieces/1password.png',
    fields: {
        serviceAccountToken: {
            displayName: 'Service Account Token',
            placeholder: 'ops_...',
            type: 'password',
        },
    },
    secretParams: {
        path: {
            displayName: 'Secret Reference',
            placeholder: 'op://vault/item/field',
            type: 'text',
        },
    },
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
            const message = error instanceof Error ? error.message : 'Unknown error'
            log.error({ message, provider: SecretManagerProviderId.ONEPASSWORD }, '[onePasswordProvider#checkConnection]')
            throw new ActivepiecesError({
                code: ErrorCode.SECRET_MANAGER_CONNECTION_FAILED,
                params: { message, provider: SecretManagerProviderId.ONEPASSWORD },
            })
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
            const message = error instanceof Error ? error.message : 'Unknown error'
            log.error({ message, provider: SecretManagerProviderId.ONEPASSWORD, request }, '[onePasswordProvider#getSecret]')
            throw new ActivepiecesError({
                code: ErrorCode.SECRET_MANAGER_GET_SECRET_FAILED,
                params: { message, provider: SecretManagerProviderId.ONEPASSWORD, request },
            })
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
