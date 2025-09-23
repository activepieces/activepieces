import { ActivepiecesError, ErrorCode, isNil } from '@activepieces/shared'
import { FastifyRequest } from 'fastify'
import { accessTokenManager } from '../../../authentication/lib/access-token-manager'
import { distributedStore } from '../../../helper/key-value'
import { BaseSecurityHandler } from '../security-handler'

export class AccessTokenAuthnHandler extends BaseSecurityHandler {
    private static readonly HEADER_NAME = 'authorization'
    private static readonly HEADER_PREFIX = 'Bearer '

    protected canHandle(request: FastifyRequest): Promise<boolean> {
        const header = request.headers[AccessTokenAuthnHandler.HEADER_NAME]
        const prefix = AccessTokenAuthnHandler.HEADER_PREFIX
        const routeMatches = header?.startsWith(prefix) ?? false
        const skipAuth = request.routeOptions.config?.skipAuth ?? false
        return Promise.resolve(routeMatches && !skipAuth)
    }

    protected async doHandle(request: FastifyRequest): Promise<void> {
        const accessToken = this.extractAccessTokenOrThrow(request)
        await this.checkIfAccessTokenIsRevokedAndThrow(accessToken)
        const principal = await accessTokenManager.verifyPrincipal(accessToken)
        request.principal = principal
    }

    private extractAccessTokenOrThrow(request: FastifyRequest): string {
        const header = request.headers[AccessTokenAuthnHandler.HEADER_NAME]
        const prefix = AccessTokenAuthnHandler.HEADER_PREFIX
        const accessToken = header?.substring(prefix.length)

        if (isNil(accessToken)) {
            throw new ActivepiecesError({
                code: ErrorCode.AUTHENTICATION,
                params: {
                    message: 'missing access token',
                },
            })
        }

        return accessToken
    }

    private async checkIfAccessTokenIsRevokedAndThrow(accessToken: string): Promise<void> {
        const revokedJwt = await distributedStore.get(`revoked:${accessToken}`)
        if (!isNil(revokedJwt)) {
            throw new ActivepiecesError({
                code: ErrorCode.SESSION_EXPIRED,
                params: {
                    message: 'Revoked access token. Sign in again',
                },
            })
        }
    }
}
