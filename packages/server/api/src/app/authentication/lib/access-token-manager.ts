import { ActivepiecesError, apId, assertNotNullOrUndefined, ErrorCode, isNil, Principal, PrincipalType, WorkerMachineType, WorkerPrincipal } from '@activepieces/shared'
import dayjs from 'dayjs'
import { jwtUtils } from '../../helper/jwt-utils'

export const accessTokenManager = {
    async generateToken(principal: Principal, expiresInSeconds: number = 7 * 30 * 24 * 60 * 60): Promise<string> {
        const secret = await jwtUtils.getJwtSecret()

        return jwtUtils.sign({
            payload: principal,
            key: secret,
            expiresInSeconds,
        })
    },

    async generateWorkerToken({ type, platformId }: { platformId: string | null, type: WorkerMachineType }) {
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
    

    async extractPrincipal(token: string): Promise<Principal> {
        const secret = await jwtUtils.getJwtSecret()

        try {
            const decoded = await jwtUtils.decodeAndVerify<Principal>({
                jwt: token,
                key: secret,
            })
            assertNotNullOrUndefined(decoded.type, 'decoded.type')
            return decoded
        }
        catch (e) {
            throw new ActivepiecesError({
                code: ErrorCode.INVALID_BEARER_TOKEN,
                params: {
                    message: 'invalid access token',
                },
            })
        }
    },
}
