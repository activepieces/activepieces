import { ActivepiecesError, apId, ErrorCode, isNil, PlatformId, ProjectId } from '@activepieces/core-utils'
import { ALL_PRINCIPAL_TYPES, EnginePrincipal, Principal, PrincipalType, WorkerPrincipal } from '@activepieces/shared'
import dayjs from 'dayjs'
import { FastifyBaseLogger } from 'fastify'
import { jwtUtils } from '../../helper/jwt-utils'
import { system } from '../../helper/system/system'
import { AppSystemProp } from '../../helper/system/system-props'
import { userService } from '../../user/user-service'
import { userIdentityService } from '../user-identity/user-identity-service'

export const accessTokenManager = (log: FastifyBaseLogger) => ({
    async generateToken(principal: Principal, expiresInSeconds: number = dayjs.duration(7, 'day').asSeconds()): Promise<string> {
        const secret = await jwtUtils.getJwtSecret()
        return jwtUtils.sign({
            payload: principal,
            key: secret,
            expiresInSeconds,
        })
    },

    async generateEngineToken({ jobId, projectId, platformId }: GenerateEngineTokenParams): Promise<string> {
        const enginePrincipal: EnginePrincipal = {
            id: jobId ?? apId(),
            type: PrincipalType.ENGINE,
            projectId,
            platform: {
                id: platformId,
            },
        }

        const secret = await jwtUtils.getJwtSecret()

        return jwtUtils.sign({
            payload: enginePrincipal,
            key: secret,
            expiresInSeconds: engineTokenTtlSeconds(),
        })
    },

    async generateWorkerToken(): Promise<string> {
        const workerPrincipal: WorkerPrincipal = {
            id: apId(),
            type: PrincipalType.WORKER,
        }

        const secret = await jwtUtils.getJwtSecret()

        return jwtUtils.sign({
            payload: workerPrincipal,
            key: secret,
            expiresInSeconds: dayjs.duration(100, 'year').asSeconds(),
        })
    },


    async verifyPrincipal(token: string): Promise<Principal> {
        const secret = await jwtUtils.getJwtSecret()

        try {
            const decoded = await jwtUtils.decodeAndVerify<Principal>({
                jwt: token,
                key: secret,
            })
            if (!ALL_PRINCIPAL_TYPES.includes(decoded.type)) {
                throw new ActivepiecesError({
                    code: ErrorCode.INVALID_BEARER_TOKEN,
                    params: {
                        message: 'invalid principal type',
                    },
                })
            }
            await assertUserSession(log, decoded)
            return decoded
        }
        catch (e) {
            if (e instanceof ActivepiecesError) {
                throw e
            }
            throw new ActivepiecesError({
                code: ErrorCode.INVALID_BEARER_TOKEN,
                params: {
                    message: 'invalid access token or session expired',
                },
            })
        }
    },
})

function engineTokenTtlSeconds(): number {
    const longestJobTimeoutSeconds = Math.max(
        system.getNumberOrThrow(AppSystemProp.FLOW_TIMEOUT_SECONDS),
        system.getNumberOrThrow(AppSystemProp.TRIGGER_TIMEOUT_SECONDS),
        system.getNumberOrThrow(AppSystemProp.TRIGGER_HOOKS_TIMEOUT_SECONDS),
    )
    const jobBoundTtlSeconds = longestJobTimeoutSeconds + ENGINE_TOKEN_TTL_MARGIN_SECONDS
    const configured = system.getNumber(AppSystemProp.ENGINE_TOKEN_TTL_SECONDS)
    return isNil(configured) ? jobBoundTtlSeconds : Math.max(configured, jobBoundTtlSeconds)
}

async function assertUserSession(log: FastifyBaseLogger, decoded: Principal | Principal): Promise<void> {
    if (decoded.type !== PrincipalType.USER && decoded.type !== PrincipalType.ONBOARDING) return

    if (decoded.type === PrincipalType.ONBOARDING) {
        const identity = await userIdentityService(log).getOneOrFail({ id: decoded.id })
        const isExpired = (identity.tokenVersion ?? null) !== (decoded.tokenVersion ?? null)
        if (isExpired || !identity.verified) {
            throw new ActivepiecesError({
                code: ErrorCode.SESSION_EXPIRED,
                params: {
                    message: 'The session has expired or the user is not verified.',
                },
            })
        }
        return
    }

    const user = await userService(log).getOneOrFail({ id: decoded.id })
    const identity = await userIdentityService(log).getOneOrFail({ id: user.identityId })
    const isExpired = (identity.tokenVersion ?? null) !== (decoded.tokenVersion ?? null)
    if (isExpired || !userService(log).isActive({ user, identity })) {
        throw new ActivepiecesError({
            code: ErrorCode.SESSION_EXPIRED,
            params: {
                message: 'The session has expired or the user is not verified.',
            },
        })
    }
    if (identity.lastLoggedInPlatformId !== decoded.platform.id) {
        await userIdentityService(log).updateLastLoggedInPlatformId({ id: identity.id, lastLoggedInPlatformId: decoded.platform.id })
    }
}

const ENGINE_TOKEN_TTL_MARGIN_SECONDS = 60 * 60

type GenerateEngineTokenParams = {
    projectId: ProjectId
    jobId?: string
    platformId: PlatformId
}
