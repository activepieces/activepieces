import { ManagedAuthnKeyPair, ManagedAuthnKeyPairId, PlatformId } from '@activepieces/ee-shared'
import { ActivepiecesError, ErrorCode, SeekPage, UserId, apId, spreadIfDefined } from '@activepieces/shared'
import { managedAuthnKeyPairGenerator } from './managed-authn-key-pair-generator'
import { databaseConnection } from '../../database/database-connection'
import { ManagedAuthnKeyPairEntity } from './managed-authn-key-pair-entity'
import { platformService } from '../platform/platform.service'

const repo = databaseConnection.getRepository<ManagedAuthnKeyPair>(ManagedAuthnKeyPairEntity)

export const managedAuthnKeyPairService = {
    async add({ userId, platformId }: AddParams): Promise<AddResponse> {
        await assertUserIsPlatformOwner({
            userId,
            platformId,
        })

        const generatedKeyPair = await managedAuthnKeyPairGenerator.generate()

        const newKeyPair: NewManagedAuthnKeyPair = {
            id: apId(),
            platformId,
            generatedBy: userId,
            publicKey: generatedKeyPair.publicKey,
            algorithm: generatedKeyPair.algorithm,
        }

        const savedKeyPair = await repo.save(newKeyPair)

        return {
            ...savedKeyPair,
            privateKey: generatedKeyPair.privateKey,
        }
    },

    async list({ platformId }: ListParams): Promise<SeekPage<ManagedAuthnKeyPair>> {
        const data = await repo.findBy({
            ...spreadIfDefined('platformId', platformId),
        })

        return {
            data,
            next: null,
            previous: null,
        }
    },

    async getOne(id: ManagedAuthnKeyPairId): Promise<ManagedAuthnKeyPair | null> {
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

type NewManagedAuthnKeyPair = Omit<ManagedAuthnKeyPair, 'created' | 'updated'>

type AddResponse = ManagedAuthnKeyPair & {
    privateKey: string
}

type ListParams = {
    platformId?: PlatformId
}
