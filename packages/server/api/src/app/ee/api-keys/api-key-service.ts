import {
    ApiKey,
    ApiKeyResponseWithValue,
} from '@activepieces/ee-shared'
import { cryptoUtils } from '@activepieces/server-shared'
import {
    ActivepiecesError,
    apId,
    assertNotNullOrUndefined,
    ErrorCode,
    isNil,
    secureApId,
    SeekPage,
} from '@activepieces/shared'
import { repoFactory } from '../../core/db/repo-factory'
import { ApiKeyEntity } from './api-key-entity'

const API_KEY_TOKEN_LENGTH = 64
const repo = repoFactory<ApiKey>(ApiKeyEntity)

export const apiKeyService = {
    async add({
        platformId,
        displayName,
    }: AddParams): Promise<ApiKeyResponseWithValue> {
        const generatedApiKey = generateApiKey()
        const savedApiKey = await repo().save({
            id: apId(),
            platformId,
            displayName,
            hashedValue: generatedApiKey.secretHashed,
            truncatedValue: generatedApiKey.secretTruncated,
        })
        return {
            ...savedApiKey,
            value: generatedApiKey.secret,
        }
    },
    async getByValueOrThrow(key: string): Promise<ApiKey> {
        assertNotNullOrUndefined(key, 'key')
        return repo().findOneByOrFail({
            hashedValue: cryptoUtils.hashSHA256(key),
        })
    },
    async list({ platformId }: ListParams): Promise<SeekPage<ApiKey>> {
        const data = await repo().findBy({
            platformId,
        })

        return {
            data,
            next: null,
            previous: null,
        }
    },
    async delete({ platformId, id }: DeleteParams): Promise<void> {
        const apiKey = await repo().findOneBy({
            platformId,
            id,
        })
        if (isNil(apiKey)) {
            throw new ActivepiecesError({
                code: ErrorCode.ENTITY_NOT_FOUND,
                params: {
                    message: `api key with id ${id} not found`,
                },
            })
        }
        await repo().delete({
            platformId,
            id,
        })
    },
}

export function generateApiKey() {
    const secretValue = secureApId(API_KEY_TOKEN_LENGTH - 3)
    const secretKey = `sk-${secretValue}`
    return {
        secret: secretKey,
        secretHashed: cryptoUtils.hashSHA256(secretKey),
        secretTruncated: secretKey.slice(-4),
    }
}

type AddParams = {
    platformId: string
    displayName: string
}

type DeleteParams = {
    id: string
    platformId: string
}

type ListParams = {
    platformId?: string
}
