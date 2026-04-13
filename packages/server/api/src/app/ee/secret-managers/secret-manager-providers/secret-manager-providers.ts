import { ActivepiecesError, ConnectSecretManagerRequest, ErrorCode, SecretManagerProviderId } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { awsProvider } from './aws-provider'
import { cyberarkConjurProvider } from './cyberark-conjur-provider'
import { hashicorpProvider } from './hashicorp-provider'
import { onePasswordProvider } from './onepassword-provider'

function extractErrorMessage(error: unknown): string {
    if (error instanceof Error) return error.message
    if (typeof error === 'string') return error
    return 'Unknown error'
}

export function throwConnectionError({ error, provider, log }: {
    error: unknown
    provider: SecretManagerProviderId
    log: FastifyBaseLogger
}): never {
    const message = extractErrorMessage(error)
    log.error({ message, provider }, '[secretManager#checkConnection]')
    throw new ActivepiecesError({
        code: ErrorCode.SECRET_MANAGER_CONNECTION_FAILED,
        params: { message, provider },
    })
}

export function throwGetSecretError({ error, path, provider, request, log }: {
    error: unknown
    path: string
    provider: SecretManagerProviderId
    request: Record<string, unknown>
    log: FastifyBaseLogger
}): never {
    const message = `[${path}] ${extractErrorMessage(error)}`
    log.error({ message, provider, request }, '[secretManager#getSecret]')
    throw new ActivepiecesError({
        code: ErrorCode.SECRET_MANAGER_GET_SECRET_FAILED,
        params: { message, provider, request },
    })
}

export type SecretManagerProvider<K extends SecretManagerProviderId> = {
    checkConnection: (config: SecretManagerConfigFor<K>) => Promise<unknown>
    connect: (config: SecretManagerConfigFor<K>) => Promise<void>
    disconnect: () => Promise<void>
    getSecret: (params: { path: string }, config: SecretManagerConfigFor<K>) => Promise<string>
}

export type SecretManagerConfigFor<K extends SecretManagerProviderId> =
  Extract<ConnectSecretManagerRequest, { providerId: K }>['config']



export type SecretManagerProvidersMap = {
    [K in SecretManagerProviderId]: SecretManagerProvider<K>
}

const secretManagerProvidersMap = (log: FastifyBaseLogger): SecretManagerProvidersMap => {
    return {
        [SecretManagerProviderId.HASHICORP]: hashicorpProvider(log),
        [SecretManagerProviderId.AWS]: awsProvider(log),
        [SecretManagerProviderId.CYBERARK]: cyberarkConjurProvider(log),
        [SecretManagerProviderId.ONEPASSWORD]: onePasswordProvider(log),
    }
}

export const secretManagerProvider = <K extends SecretManagerProviderId>(log: FastifyBaseLogger, providerId: K): SecretManagerProvider<K> => {
    return secretManagerProvidersMap(log)[providerId]
}
