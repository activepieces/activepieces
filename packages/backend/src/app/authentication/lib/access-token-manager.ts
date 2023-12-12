import { Principal } from '@activepieces/shared'
import { ActivepiecesError, ErrorCode } from '@activepieces/shared'
import { jwtUtils } from '../../helper/jwt-utils'


export const accessTokenManager = {
    async generateToken(principal: Principal): Promise<string> {
        const secret = await jwtUtils.getJwtSecret()

        return jwtUtils.sign({
            payload: principal,
            key: secret,
        })
    },

    async extractPrincipal(token: string): Promise<Principal> {
        const secret = await jwtUtils.getJwtSecret()

        try {
            return await jwtUtils.decodeAndVerify({
                jwt: token,
                key: secret,
            })
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
