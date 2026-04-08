import { createClient } from '@1password/sdk'
import { ActivepiecesError, ErrorCode, OnePasswordProviderConfig, SecretManagerProviderId } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { SecretManagerProvider, throwConnectionError, throwGetSecretError } from './secret-manager-providers'

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
