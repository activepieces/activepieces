import { ActivepiecesError, ErrorCode, UserIdentityProvider, UserIdentity, tryCatch } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { nanoid } from 'nanoid'
import auth from '../better-auth/auth'
import { databaseConnection } from '../../database/database-connection'
import { EntityManager } from 'typeorm'
import { userService } from '../../user/user-service'

const userIdentityRepository = (entityManager?: EntityManager) => (entityManager ?? databaseConnection()).getRepository('user_identity')

export const userIdentityService = (log: FastifyBaseLogger) => ({

    async create(params: CreateIdentityParams): Promise<UserIdentity> {
        log.info({
            email: params.email,
        }, 'Creating user identity')

        const response = await auth.api.signUpEmail({
            body: {
                email: params.email,
                name: `${params.firstName } ${params.lastName}`,
                password: params.password,
                firstName: params.firstName,
                lastName: params.lastName,
                provider: params.provider,
                trackEvents: params.trackEvents,
                newsLetter: params.newsLetter,
                tokenVersion: nanoid(),
            },
        })
        
        if (!response) {
            throw new ActivepiecesError({
                code: ErrorCode.EXISTING_USER,
                params: {
                    email: params.email,
                    platformId: null,
                },
            })
        }
       
        return response.user as UserIdentity
    },
    async verifyIdentityPassword(params: VerifyIdentityPasswordParams): Promise<UserIdentity> {
        const { error, data } = await tryCatch(async () => await auth.api.signInEmail({
            body: {
                email: params.email,
                password: params.password
            }
        }))

        if (error) {
            if (error.message === "Invalid email or password")
                throw new ActivepiecesError({
                    code: ErrorCode.INVALID_CREDENTIALS,
                    params: null,
                })
            if (error.message === "Email not verified"){
               
                await this.sendVerifyEmail({ email: params.email })
                throw new ActivepiecesError({
                    code: ErrorCode.EMAIL_IS_NOT_VERIFIED,
                    params: {
                        email: params.email,
                    },
                })
            }
            throw new ActivepiecesError({
                code: ErrorCode.AUTHENTICATION,
                params: {
                    message: error.message,
                },
            })
        }

        return data.user as UserIdentity 
    },
    async getIdentityByEmail(email: string): Promise<UserIdentity | null> {
        const cleanedEmail = email.toLowerCase().trim()
        const identity = await userIdentityRepository().findOneBy({ email: cleanedEmail })
        return identity as UserIdentity | null
    },
    async getOne(params: GetOneOrFailParams): Promise<UserIdentity | null > {
        const identity = await userIdentityRepository().findOneBy({ id: params.id })
        return identity as UserIdentity | null
    },
    async getOneOrFail(params: GetOneOrFailParams): Promise<UserIdentity> {
        const identity = await userIdentityRepository().findOneByOrFail({ id: params.id })
        return identity as UserIdentity
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
    async sendVerifyEmail(params: SendVerificationEmailParams): Promise<void> {
        await auth.api.sendVerificationEmail({
            body: {
                email: params.email,
            },
            query: {
                platformId: params.platformId ?? await getPlatformIdByEmail(params.email),
            }
        })
    },
    async verifyEmail(params: VerifyEmailParams): Promise<UserIdentity> {
        const res = await auth.api.verifyEmail({
            query: {
                token: params.otp
            }
        })
        if (res?.status === false) {
            throw new ActivepiecesError({
                code: ErrorCode.INVALID_OTP,
                params: {},
            })
        }
        const user = await userIdentityRepository().findOneByOrFail({ id: params.identityId })
        return user as UserIdentity 
    },
    async sendResetPasswordEmail(params: SendResetPasswordParams): Promise<void> {
        await auth.api.requestPasswordReset({
            body: {
                email: params.email,
            },
            query: {
                platformId: params.platformId ?? await getPlatformIdByEmail(params.email),
            }
        })
    },
    async resetPassword(params: ResetPasswordParams): Promise<UserIdentity> {
        const res = await auth.api.resetPassword({
            body: {
                token: params.otp,
                newPassword: params.newPassword
            }
        })
        if (res?.status === false) {
            throw new ActivepiecesError({
                code: ErrorCode.INVALID_OTP,
                params: {},
            })
        }
        const user = await userIdentityRepository().findOneByOrFail({ id: params.identityId })
        return user as UserIdentity 
    },
    // to force verification
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
        await userIdentityRepository().update({ id }, {
            emailVerified: true
        })
        return {
            ...user as UserIdentity,
            emailVerified: true
        }
    },
    async unDraft(id: string): Promise<UserIdentity> {
        const identity = await userIdentityRepository().findOneByOrFail({ id })
        await userIdentityRepository().update({ id }, {
            draft: false
        })
        return {
            ...identity as UserIdentity,
            draft: false
        }
    },
    async delete(id: string, entityManager?: EntityManager): Promise<void> {
        await userIdentityRepository(entityManager).delete({ id })
    }
})

const getPlatformIdByEmail = async (email: string) => {
    const identity = await userIdentityRepository().findOneByOrFail({ email })
    const user     = await userService.getOneByIdentityIdOnly({ identityId: identity.id })
    return user?.platformId ?? null
}

type CreateIdentityParams =
    Pick<UserIdentity, 'email' | 'firstName' | 'lastName' | 'trackEvents' | 'newsLetter' | 'provider'> &
    (
        | { provider: UserIdentityProvider.EMAIL | UserIdentityProvider.JWT, password: string }
    );

type GetOneOrFailParams = {
    id: string
}

type VerifyIdentityPasswordParams = {
    email: string
    password: string
}

type SendVerificationEmailParams = {
    email: string
    platformId?: string
}

type VerifyEmailParams = {
    identityId: string,
    otp: string
}

type SendResetPasswordParams = {
    email: string
    platformId?: string
}

type ResetPasswordParams = {
    identityId: string,
    otp: string,
    newPassword: string
}