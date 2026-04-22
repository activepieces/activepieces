import { ActivepiecesError, AuthenticationResponse, ErrorCode, tryCatch, UserIdentityProvider } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { databaseConnection } from '../../database/database-connection'
import { userService } from '../../user/user-service'
import { authenticationService } from '../authentication.service'
import { betterAuthInstance } from '../better-auth/auth'
import { userIdentityService } from '../user-identity/user-identity-service'

export const twoFactorService = (log: FastifyBaseLogger) => ({
    async enable(params: EnableParams): Promise<TwoFactorResult<{ totpURI: string, backupCodes: string[] }>> {
        const { error, data } = await tryCatch(async () =>
            betterAuthInstance.get().api.enableTwoFactor({
                body: { password: params.password },
                headers: getSessionHeaders(params.cookie),
                returnHeaders: true,
            }),
        )
        if (error || !data?.response) {
            throwBetterAuthError(error, 'password')
        }
        return { result: { totpURI: data.response.totpURI, backupCodes: data.response.backupCodes }, responseHeaders: data.headers }
    },

    async verifyTotp(params: VerifyParams): Promise<TwoFactorResult<AuthenticationResponse>> {
        const { error, data } = await tryCatch(async () =>
            betterAuthInstance.get().api.verifyTOTP({
                body: { code: params.code },
                headers: getSessionHeaders(params.cookie),
                returnHeaders: true,
            }),
        )
        if (error || !data?.response) {
            throwBetterAuthError(error, 'code')
        }
        const authResponse = await exchangeSessionAfterMfa({ identityId: data.response.user.id, predefinedPlatformId: params.predefinedPlatformId, log })
        return { result: authResponse, responseHeaders: data.headers }
    },

    async verifyBackupCode(params: VerifyParams): Promise<TwoFactorResult<AuthenticationResponse>> {
        const { error, data } = await tryCatch(async () =>
            betterAuthInstance.get().api.verifyBackupCode({
                body: { code: params.code },
                headers: getSessionHeaders(params.cookie),
                returnHeaders: true,
            }),
        )
        if (error || !data?.response) {
            throwBetterAuthError(error, 'code')
        }
        const authResponse = await exchangeSessionAfterMfa({ identityId: data.response.user.id, predefinedPlatformId: params.predefinedPlatformId, log })
        return { result: authResponse, responseHeaders: data.headers }
    },

    async disable(params: EnableParams): Promise<TwoFactorResult<{ status: boolean }>> {
        const { error, data } = await tryCatch(async () =>
            betterAuthInstance.get().api.disableTwoFactor({
                body: { password: params.password },
                headers: getSessionHeaders(params.cookie),
                returnHeaders: true,
            }),
        )
        if (error || !data) {
            throwBetterAuthError(error, 'password')
        }
        return { result: { status: true }, responseHeaders: data.headers }
    },

    async generateBackupCodes(params: EnableParams): Promise<TwoFactorResult<{ backupCodes: string[] }>> {
        const { error, data } = await tryCatch(async () =>
            betterAuthInstance.get().api.generateBackupCodes({
                body: { password: params.password },
                headers: getSessionHeaders(params.cookie),
                returnHeaders: true,
            }),
        )
        if (error || !data?.response) {
            throwBetterAuthError(error, 'password')
        }
        return { result: { backupCodes: data.response.backupCodes }, responseHeaders: data.headers }
    },

    async getStatus(params: GetStatusParams): Promise<{ enabled: boolean, backupCodesRemaining: number, hasPassword: boolean }> {
        const user = await userService(log).getOneOrFail({ id: params.userId })
        const identity = await userIdentityService(log).getOneOrFail({ id: user.identityId })
        const backupCodesRemaining = await countRemainingBackupCodes(identity.id)
        return {
            enabled: identity.twoFactorEnabled ?? false,
            backupCodesRemaining,
            hasPassword: identity.provider === UserIdentityProvider.EMAIL,
        }
    },
})

async function exchangeSessionAfterMfa(params: { identityId: string, predefinedPlatformId: string | null, log: FastifyBaseLogger }): Promise<AuthenticationResponse> {
    return authenticationService(params.log).exchangeSessionPostMfa({
        identityId: params.identityId,
        predefinedPlatformId: params.predefinedPlatformId,
    })
}

function throwBetterAuthError(error: Error | null, input: 'code' | 'password'): never {
    const statusCode = extractBetterAuthStatusCode(error)
    if (statusCode === 401) {
        throw new ActivepiecesError({
            code: ErrorCode.AUTHENTICATION,
            params: { message: 'Session expired' },
        })
    }
    throw new ActivepiecesError({
        code: ErrorCode.AUTHENTICATION,
        params: { message: `Invalid ${input}` },
    })
}

function extractBetterAuthStatusCode(error: unknown): number | null {
    if (typeof error === 'object' && error !== null && 'statusCode' in error) {
        return (error as { statusCode: number }).statusCode
    }
    return null
}

function getSessionHeaders(cookie: string): Headers {
    return new Headers({ cookie })
}

async function countRemainingBackupCodes(identityId: string): Promise<number> {
    const rows = await databaseConnection().query(
        'SELECT "backupCodes" FROM "twoFactor" WHERE "userId" = $1 LIMIT 1',
        [identityId],
    ) as Array<{ backupCodes: string | null }>
    if (!rows.length || !rows[0].backupCodes) {
        return 0
    }
    try {
        const codes = JSON.parse(rows[0].backupCodes) as unknown[]
        return Array.isArray(codes) ? codes.length : 0
    }
    catch {
        return 0
    }
}

type EnableParams = {
    password?: string
    cookie: string
}

type VerifyParams = {
    code: string
    cookie: string
    predefinedPlatformId: string | null
}

type GetStatusParams = {
    userId: string
}

export type TwoFactorResult<T> = {
    result: T
    responseHeaders: Headers | null
}
