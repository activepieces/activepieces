import { SigningKey, SigningKeyId, PlatformId } from '@activepieces/ee-shared'
import { ActivepiecesError, ErrorCode, SeekPage, UserId, apId, spreadIfDefined } from '@activepieces/shared'
import { signingKeyGenerator } from './signing-key-generator'
import { databaseConnection } from '../../database/database-connection'
import { SigningKeyEntity } from './signing-key-entity'
import { platformService } from '../platform/platform.service'

const repo = databaseConnection.getRepository<SigningKey>(SigningKeyEntity)

export const signingKeyService = {
    async add({ userId, platformId }: AddParams): Promise<AddResponse> {
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

    async getOne(id: SigningKeyId): Promise<SigningKey | null> {
        return repo.findOneBy({
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
}

type NewSigningKey = Omit<SigningKey, 'created' | 'updated'>

type AddResponse = SigningKey & {
    privateKey: string
}

type ListParams = {
    platformId?: PlatformId
}
