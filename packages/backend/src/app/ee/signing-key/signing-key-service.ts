import { SigningKey, SigningKeyId, PlatformId, AddSigningKeyResponse } from '@activepieces/ee-shared'
import { ActivepiecesError, ErrorCode, SeekPage, UserId, apId, spreadIfDefined } from '@activepieces/shared'
import { signingKeyGenerator } from './signing-key-generator'
import { databaseConnection } from '../../database/database-connection'
import { SigningKeyEntity } from './signing-key-entity'
import { platformService } from '../platform/platform.service'

const repo = databaseConnection.getRepository<SigningKey>(SigningKeyEntity)

export const signingKeyService = {
    async add({ userId, platformId, displayName }: AddParams): Promise<AddSigningKeyResponse> {
        await assertUserIsPlatformOwner({
            userId,
            platformId,
        })

        const generatedSigningKey = await signingKeyGenerator.generate()

        const newSigningKey: NewSigningKey = {
            id: apId(),
            platformId,
            generatedBy: userId,
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
            ...spreadIfDefined('platformId', platformId),
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

    async delete({ userId, platformId, id }: DeleteParams): Promise<void> {
        await assertUserIsPlatformOwner({
            userId,
            platformId,
        })

        await repo.delete({
            platformId,
            id,
        })
    },
}

const assertUserIsPlatformOwner = async ({ userId, platformId }: AssertUserIsPlatformOwnerParams): Promise<void> => {
    const userIsOwner = await platformService.checkUserIsOwner({
        userId,
        platformId,
    })

    if (!userIsOwner) {
        throw new ActivepiecesError({
            code: ErrorCode.AUTHORIZATION,
            params: {},
        })
    }
}

type AssertUserIsPlatformOwnerParams = {
    userId: UserId
    platformId: PlatformId
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
    userId: UserId
    platformId: PlatformId
}

type NewSigningKey = Omit<SigningKey, 'created' | 'updated'>

type ListParams = {
    platformId?: PlatformId
}
