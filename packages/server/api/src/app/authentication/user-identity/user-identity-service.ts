import { ActivepiecesError, apId, ErrorCode, isNil, UserIdentity } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { nanoid } from 'nanoid'
import { repoFactory } from '../../core/db/repo-factory'
import { UserEntity } from '../../user/user-entity'
import { passwordHasher } from '../lib/password-hasher'
import { UserIdentityEntity } from './user-identity-entity'

export const userIdentityRepository = repoFactory(UserIdentityEntity)
export const userRepo = repoFactory(UserEntity)


export const userIdentityService = (log: FastifyBaseLogger) => ({
    async create(params: Pick<UserIdentity, 'email' | 'password' | 'firstName' | 'lastName' | 'trackEvents' | 'newsLetter' | 'provider' | 'verified'>): Promise<UserIdentity> {
        log.info({
            email: params.email,
        }, 'Creating user identity')

        const cleanedEmail = params.email.toLowerCase().trim()
        const hashedPassword = await passwordHasher.hash(params.password)
        const userIdentityByEmail = await userIdentityRepository().findOne({ where: { email: cleanedEmail } })
        let userByEmail = null
        if (userIdentityByEmail) {
            userByEmail = await userRepo().findOne({ where: { identityId: userIdentityByEmail.id } })
        }

        // If an identity exists but there's no corresponding user record (user was deleted),
        // return the existing identity so the caller can create a new user row.
        if (userIdentityByEmail && userByEmail == null) {
            return userIdentityByEmail
        }
        // If both identity and user exist, treat as an existing user.
        if (userIdentityByEmail && userByEmail != null) {
            throw new ActivepiecesError({
                code: ErrorCode.EXISTING_USER,
                params: {
                    email: cleanedEmail,
                    platformId: null,
                },
            })
        }
        const newUserIdentity: UserIdentity = {
            firstName: params.firstName,
            lastName: params.lastName,
            provider: params.provider,
            email: cleanedEmail,
            created: new Date().toISOString(),
            updated: new Date().toISOString(),
            verified: params.verified,
            id: apId(),
            password: hashedPassword,
            trackEvents: params.trackEvents,
            newsLetter: params.newsLetter,
            tokenVersion: nanoid(),
        }
        const identity = await userIdentityRepository().save(newUserIdentity)
        return identity
    },
    async verifyIdentityPassword(params: VerifyIdentityPasswordParams): Promise<UserIdentity> {
        const userIdentity = await getIdentityByEmail(params.email)
        if (isNil(userIdentity)) {
            throw new ActivepiecesError({
                code: ErrorCode.INVALID_CREDENTIALS,
                params: null,
            })
        }
        if (!userIdentity.verified) {
            throw new ActivepiecesError({
                code: ErrorCode.EMAIL_IS_NOT_VERIFIED,
                params: {
                    email: userIdentity.email,
                },
            })
        }

        const passwordMatches = await passwordHasher.compare(params.password, userIdentity.password)
        if (!passwordMatches) {
            throw new ActivepiecesError({
                code: ErrorCode.INVALID_CREDENTIALS,
                params: null,
            })
        }
        return userIdentity
    },
    async getIdentityByEmail(email: string): Promise<UserIdentity | null> {
        const cleanedEmail = email.toLowerCase().trim()
        return userIdentityRepository().findOneBy({ email: cleanedEmail })
    },
    async getOneOrFail(params: GetOneOrFailParams): Promise<UserIdentity> {
        const userIdentity = await userIdentityRepository().findOneByOrFail({ id: params.id })
        return userIdentity
    },
    async getBasicInformation(id: string): Promise<Pick<UserIdentity, 'email' | 'firstName' | 'lastName' | 'trackEvents' | 'newsLetter'>> {
        const user = await userIdentityRepository().findOneByOrFail({ id })
        return {
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            trackEvents: user.trackEvents,
            newsLetter: user.newsLetter,
        }
    },
    async updatePassword(params: UpdatePasswordParams): Promise<void> {
        const hashedPassword = await passwordHasher.hash(params.newPassword)
        await userIdentityRepository().update(params.id, {
            password: hashedPassword,
            tokenVersion: nanoid(),
        })
    },
    async updateVerifiedStatus(params: UpdateStatusParams): Promise<void> {        
        await userIdentityRepository().update(params?.platformId, {
            verified: params.verified,
            updated: new Date().toISOString(), 
        })
    },
    async verify(id: string): Promise<UserIdentity> {
        const user = await userIdentityRepository().findOneByOrFail({ id })
        if (user.verified) {
            throw new ActivepiecesError({
                code: ErrorCode.AUTHORIZATION,
                params: {
                    message: 'User is already verified',
                },
            })
        }
        return userIdentityRepository().save({
            ...user,
            verified: true,
        })
    },
})


async function getIdentityByEmail(email: string): Promise<UserIdentity | null> {
    const cleanedEmail = email.toLowerCase().trim()
    return userIdentityRepository().findOneBy({ email: cleanedEmail })
}

type GetOneOrFailParams = {
    id: string
}

type UpdatePasswordParams = {
    id: string
    newPassword: string
}

type VerifyIdentityPasswordParams = {
    email: string
    password: string
}

type UpdateStatusParams = {
    verified: boolean
    platformId: string

}
