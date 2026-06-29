import { FastifyBaseLogger } from 'fastify'
import { JwtAudience, jwtUtils } from './jwt-utils'

const TEN_MINUTES_IN_SECONDS = 10 * 60

export const connectTokenService = (_log: FastifyBaseLogger) => ({
    async issue(payload: ConnectTokenPayload): Promise<{ token: string, expiresAt: string }> {
        const key = await jwtUtils.getJwtSecret()
        const token = await jwtUtils.sign({
            payload,
            key,
            audience: JwtAudience.CONNECT_LINK_TOKEN,
            expiresInSeconds: TEN_MINUTES_IN_SECONDS,
        })
        const expiresAt = new Date(Date.now() + TEN_MINUTES_IN_SECONDS * 1000).toISOString()
        return { token, expiresAt }
    },

    async verify(token: string): Promise<ConnectTokenPayload> {
        const key = await jwtUtils.getJwtSecret()
        return jwtUtils.decodeAndVerify<ConnectTokenPayload>({
            jwt: token,
            key,
            audience: JwtAudience.CONNECT_LINK_TOKEN,
        })
    },
})

export type ConnectTokenPayload = {
    platformId: string
    projectId: string
    pieceName: string
    externalId: string
    displayName?: string
}
