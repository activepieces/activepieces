import { ActivepiecesError, ErrorCode, spreadIfDefined, tryCatch, UserIdentity, UserIdentityProvider } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { nanoid } from 'nanoid'
import { EntityManager } from 'typeorm'
import { repoFactory } from '../../core/db/repo-factory'
import { userRepo } from '../../user/user-service'
import { betterAuthInstance } from '../better-auth/auth'
import { passwordHasher } from '../lib/password-hasher'
import { UserIdentityEntity } from './user-identity-entity'

export const userIdentityRepository = repoFactory(UserIdentityEntity)

export const userIdentityService = (log: FastifyBaseLogger) => ({

    async create(params: CreateIdentityParams): Promise<UserIdentity> {
        log.info({ email: params.email }, 'Creating user identity')

        const { error, data: response } = await tryCatch(async () => betterAuthInstance.get().api.signUpEmail({
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
        }))

        if (error || !response?.user) {
            const isExistingUser = !error
                || error.message === 'User already exists'
                || ("code" in error && error.code === 'USER_ALREADY_EXISTS')
            if (isExistingUser) {
                throw new ActivepiecesError({
                    code: ErrorCode.EXISTING_USER,
                    params: {
                        email: params.email,
                        platformId: null,
                    },
                })
            }
            log.error({ err: error, email: params.email }, '[userIdentityService#create] signUpEmail failed unexpectedly')
            throw new ActivepiecesError({
                code: ErrorCode.AUTHENTICATION,
                params: {
                    message: 'Sign up failed',
                },
            })
        }

        // Verify the user was actually created — signUpEmail returns a synthetic
        // user with a fake ID when the email already exists (to prevent enumeration)
        const identity = await userIdentityRepository().findOneBy({ id: response.user.id as string })
        if (!identity) {
            throw new ActivepiecesError({
                code: ErrorCode.EXISTING_USER,
                params: {
                    email: params.email,
                    platformId: null,
                },
            })
        }

        // Sync hashed password into user_identity for rollback compatibility
        const hashedPassword = await passwordHasher.hash(params.password)
        await userIdentityRepository().update({ id: identity.id }, {
            password: hashedPassword,
            emailVerified: params.emailVerified ?? false,
        })

        return {
            ...identity,
            password: hashedPassword,
            emailVerified: params.emailVerified ?? false,
        }
    },
    async verifyIdentityPassword(params: VerifyIdentityPasswordParams): Promise<VerifyIdentityPasswordResult> {
        const { error, data } = await tryCatch(async () => betterAuthInstance.get().api.signInEmail({
            body: {
                email: params.email,
                password: params.password,
            },
            returnHeaders: true,
        }))

        if (error) {
            if (error.message === 'Invalid email or password')
                throw new ActivepiecesError({
                    code: ErrorCode.INVALID_CREDENTIALS,
                    params: null,
                })
            if (error.message === 'Email not verified') {
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

        const responseHeaders = data.headers ?? null
        const response: unknown = data.response
        const twoFactorRedirect = typeof response === 'object' && response !== null && 'twoFactorRedirect' in response && response['twoFactorRedirect'] === true

        const identity = await userIdentityRepository().findOneByOrFail({ email: params.email.toLowerCase().trim() })
        return { identity, responseHeaders, twoFactorRedirect }
    },
    async getIdentityByEmail(email: string): Promise<UserIdentity | null> {
        const cleanedEmail = email.toLowerCase().trim()
        const identity = await userIdentityRepository().findOneBy({ email: cleanedEmail })
        return identity
    },
    async getOne(params: GetOneOrFailParams): Promise<UserIdentity | null > {
        const identity = await userIdentityRepository().findOneBy({ id: params.id })
        return identity
    },
    async getOneOrFail(params: GetOneOrFailParams): Promise<UserIdentity> {
        const identity = await userIdentityRepository().findOneByOrFail({ id: params.id })
        return identity
    },
    async getBasicInformation(id: string): Promise<Pick<UserIdentity, 'email' | 'firstName' | 'lastName' | 'trackEvents' | 'newsLetter' | 'imageUrl'>> {
        const user = await userIdentityRepository().findOneByOrFail({ id })
        return {
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            trackEvents: user.trackEvents,
            newsLetter: user.newsLetter,
            imageUrl: user.imageUrl,
        }
    },
    async sendVerifyEmail(params: SendVerificationEmailParams): Promise<void> {
        await betterAuthInstance.get().api.sendVerificationEmail({
            body: {
                email: params.email,
            },
            query: {
                platformId: params.platformId ?? await getPlatformIdByEmail(params.email),
            },
        })
    },
    async verifyEmail(params: VerifyEmailParams): Promise<UserIdentity> {
        const res = await betterAuthInstance.get().api.verifyEmail({
            query: {
                token: params.otp,
            },
        })
        if (res?.status === false) {
            throw new ActivepiecesError({
                code: ErrorCode.INVALID_OTP,
                params: {},
            })
        }
        const user = await userIdentityRepository().findOneByOrFail({ id: params.identityId })
        if (!user.emailVerified) {
            throw new ActivepiecesError({
                code: ErrorCode.INVALID_OTP,
                params: {},
            })
        }
        return user
    },
    async sendResetPasswordEmail(params: SendResetPasswordParams): Promise<void> {
        await betterAuthInstance.get().api.requestPasswordReset({
            body: {
                email: params.email,
            },
            query: {
                platformId: params.platformId ?? await getPlatformIdByEmail(params.email),
            },
        })
    },
    async resetPassword(params: ResetPasswordParams): Promise<UserIdentity> {
        const res = await betterAuthInstance.get().api.resetPassword({
            body: {
                token: params.otp,
                newPassword: params.newPassword,
            },
        })
        if (res?.status === false) {
            throw new ActivepiecesError({
                code: ErrorCode.INVALID_OTP,
                params: {},
            })
        }
        const hashedPassword = await passwordHasher.hash(params.newPassword)
        await userIdentityRepository().update({ id: params.identityId }, { password: hashedPassword })
        const user = await userIdentityRepository().findOneByOrFail({ id: params.identityId })
        return user
    },
    // to force verification
    async verify(id: string): Promise<UserIdentity> {
        const user = await userIdentityRepository().findOneByOrFail({ id })
        if (user.emailVerified) {
            return user
        }
        await userIdentityRepository().update({ id }, {
            emailVerified: true,
        })
        return {
            ...user,
            emailVerified: true,
        }
    },
    async update(id: string, params: UpdateParams): Promise<void> {
        await userIdentityRepository().update(id, {
            ...params,
            ...spreadIfDefined('password', params.password ? await passwordHasher.hash(params.password) : undefined),
        })
    },
    async delete(id: string, entityManager?: EntityManager): Promise<void> {
        await userIdentityRepository(entityManager).delete({ id })
    },
})

const getPlatformIdByEmail = async (email: string) => {
    const identity = await userIdentityRepository().findOneByOrFail({ email })
    const user = await userRepo().findOneBy({ identityId: identity.id })
    return user?.platformId ?? null
}

type CreateIdentityParams =
    Pick<UserIdentity, 'email' | 'firstName' | 'lastName' | 'trackEvents' | 'newsLetter' | 'provider'> & {
        imageUrl?: string | null
    } & (
        | { provider: UserIdentityProvider.EMAIL | UserIdentityProvider.JWT | UserIdentityProvider.SAML, password: string, emailVerified?: boolean }
    )

type GetOneOrFailParams = {
    id: string
}


type UpdateParams = {
    firstName?: string
    lastName?: string
    password?: string
    imageUrl?: string | null
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
    identityId: string
    otp: string
}

type SendResetPasswordParams = {
    email: string
    platformId?: string
}

type ResetPasswordParams = {
    identityId: string
    otp: string
    newPassword: string
}

type VerifyIdentityPasswordResult = {
    identity: UserIdentity
    responseHeaders: Headers | null
    twoFactorRedirect: boolean
}
