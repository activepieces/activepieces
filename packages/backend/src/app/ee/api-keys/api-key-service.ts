import { PlatformId, ApiKeyResponseWithValue, ApiKey } from '@activepieces/ee-shared'
import { SeekPage, UserId, apId, assertNotNullOrUndefined, secureApId } from '@activepieces/shared'
import { databaseConnection } from '../../database/database-connection'
import { ApiKeyEntity } from './api-key-entity'
import { hashSHA256 } from '../../helper/crypto'

const API_KEY_TOKEN_LENGTH = 64
const repo = databaseConnection.getRepository<ApiKey>(ApiKeyEntity)

export const apiKeyService = {
    async add({ userId, platformId, displayName }: AddParams): Promise<ApiKeyResponseWithValue> {
        const generatedApiKey = generateApiKey()
        const savedApiKey = await repo.save({
            id: apId(),
            userId,
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
        return repo.findOneByOrFail({
            hashedValue: hashSHA256(key),
        })
    },
    async list({ platformId }: ListParams): Promise<SeekPage<ApiKey>> {
        const data = await repo.findBy({
            platformId,
        })

        return {
            data,
            next: null,
            previous: null,
        }
    },
    async delete({ platformId, id }: DeleteParams): Promise<void> {
        await repo.delete({
            platformId,
            id,
        })
    },
}


function generateApiKey() {
    const secretValue = secureApId(API_KEY_TOKEN_LENGTH - 3)
    const secretKey = `sk-${secretValue}`
    return {
        secret: secretKey,
        secretHashed: hashSHA256(secretKey),
        secretTruncated: secretKey.slice(-4),
    }
}


type AddParams = {
    userId: UserId
    platformId: PlatformId
    displayName: string
}

type DeleteParams = {
    id: string
    platformId: PlatformId
}

type ListParams = {
    platformId?: PlatformId
}
