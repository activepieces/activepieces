import { ActivepiecesError, apId, assertNotNullOrUndefined, EnginePrincipal, ErrorCode, isNil, PlatformId, Principal, PrincipalType, ProjectId, UserStatus, WorkerMachineType, WorkerPrincipal } from '@activepieces/shared'
import dayjs from 'dayjs'
import { jwtUtils } from '../../helper/jwt-utils'
import { userService } from '../../user/user-service'

export const accessTokenManager = {
    async generateToken(principal: Principal, expiresInSeconds: number = dayjs.duration(7, 'day').asSeconds()): Promise<string> {
        const secret = await jwtUtils.getJwtSecret()
        return jwtUtils.sign({
            payload: principal,
            key: secret,
            expiresInSeconds,
        })
    },

    async generateEngineToken({ jobId, projectId, queueToken, platformId }: GenerateEngineTokenParams): Promise<string> {
        const enginePrincipal: EnginePrincipal = {
            id: jobId ?? apId(),
            type: PrincipalType.ENGINE,
            projectId,
            platform: {
                id: platformId,
            },
            queueToken,
        }

        const secret = await jwtUtils.getJwtSecret()

        return jwtUtils.sign({
            payload: enginePrincipal,
            key: secret,
            expiresInSeconds: dayjs.duration(2, 'days').asSeconds(),
        })
    },

    async generateWorkerToken({ type, platformId }: { platformId: string | null, type: WorkerMachineType }): Promise<string> {
        const workerPrincipal: WorkerPrincipal = {
            id: apId(),
            type: PrincipalType.WORKER,
            platform: isNil(platformId) ? null : {
                id: platformId,
            },
            worker: {
                type,
            },
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
            assertNotNullOrUndefined(decoded.type, 'decoded.type')
            await assertUserSession(decoded)
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
}

async function assertUserSession(decoded: Principal): Promise<void> {
    if (decoded.type !== PrincipalType.USER) return
    
    const user = await userService.getOneOrFail({ id: decoded.id })
    const isExpired = (user.tokenVersion ?? null) !== (decoded.tokenVersion ?? null)
    if (isExpired || user.status === UserStatus.INACTIVE) {
        throw new ActivepiecesError({
            code: ErrorCode.SESSION_EXPIRED,
            params: {
                message: 'The session has expired.',
            },
        })
    }
}

type GenerateEngineTokenParams = {
    projectId: ProjectId | undefined
    queueToken?: string
    jobId?: string
    platformId: PlatformId
}
