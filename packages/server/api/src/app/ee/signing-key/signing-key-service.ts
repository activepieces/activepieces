import {
    SigningKey,
    SigningKeyId,
    AddSigningKeyResponse,
} from '@activepieces/ee-shared'
import {
    ActivepiecesError,
    ErrorCode,
    SeekPage,
    UserId,
    apId,
    isNil,
    PlatformId,
} from '@activepieces/shared'
import { signingKeyGenerator } from './signing-key-generator'
import { databaseConnection } from '../../database/database-connection'
import { SigningKeyEntity } from './signing-key-entity'
import { userService } from '../../user/user-service'

const repo = databaseConnection.getRepository<SigningKey>(SigningKeyEntity)

export const signingKeyService = {
    async add({ userId, platformId, displayName }: AddParams): Promise<AddSigningKeyResponse> {
        const generatedSigningKey = await signingKeyGenerator.generate()

        const userEmail = await getUserEmailOrThrow(userId)

        const newSigningKey: NewSigningKey = {
            id: apId(),
            platformId,
            generatedBy: userId,
            generatedByEmail: userEmail,
            publicKey: generatedSigningKey.publicKey,
            algorithm: generatedSigningKey.algorithm,
            displayName,
        }

        const savedKeyPair = await repo.save(newSigningKey)

        return {
            ...savedKeyPair,
            privateKey: generatedSigningKey.privateKey,
        }
    },

    async list({ platformId }: ListParams): Promise<SeekPage<SigningKey>> {
        const data = await repo.findBy({
            platformId,
        })

        return {
            data,
            next: null,
            previous: null,
        }
    },

    async get({ id }: GetParams): Promise<SigningKey | null> {
        return repo.findOneBy({
            id,
        })
    },

    async delete({ platformId, id }: DeleteParams): Promise<void> {
        const entity = await repo.findOneBy({
            platformId,
            id,
        })
        if (isNil(entity)) {
            throw new ActivepiecesError({
                code: ErrorCode.ENTITY_NOT_FOUND,
                params: {
                    message: `signing key with id ${id} not found`,
                },
            })
        }
        await repo.delete({
            platformId,
            id,
        })
    },
}

const getUserEmailOrThrow = async (userId: UserId): Promise<string> => {
    const user = await userService.getMetaInfo({ id: userId })

    if (isNil(user)) {
        throw new ActivepiecesError({
            code: ErrorCode.ENTITY_NOT_FOUND,
            params: {
                entityId: userId,
                entityType: 'user',
            },
        })
    }

    return user.email
}

type AddParams = {
    userId: UserId
    platformId: PlatformId
    displayName: string
}

type GetParams = {
    id: SigningKeyId
}

type DeleteParams = {
    id: SigningKeyId
    platformId: PlatformId
}

type NewSigningKey = Omit<SigningKey, 'created' | 'updated'>

type ListParams = {
    platformId?: PlatformId
}
