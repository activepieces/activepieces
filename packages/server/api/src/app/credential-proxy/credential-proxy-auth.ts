import { createHash, timingSafeEqual } from 'node:crypto'
import { ActivepiecesError, ErrorCode, isNil } from '@activepieces/core-utils'
import { CredentialProxyPrincipal, PrincipalType } from '@activepieces/shared'
import { system } from '../helper/system/system'
import { AppSystemProp } from '../helper/system/system-props'

export const credentialProxyAuth = {
    isProxyToken(authorizationHeader: string): boolean {
        return authorizationHeader.startsWith(BEARER_PREFIX)
    },
    verifyOrThrow(authorizationHeader: string): CredentialProxyPrincipal {
        const configured = system.get(AppSystemProp.CREDENTIAL_PROXY_SECRET)
        const presented = authorizationHeader.slice(BEARER_PREFIX.length)
        if (isNil(configured) || !digestsMatch({ presented, configured })) {
            throw new ActivepiecesError({
                code: ErrorCode.AUTHENTICATION,
                params: {
                    message: 'invalid credential proxy secret',
                },
            })
        }
        return {
            id: CREDENTIAL_PROXY_PRINCIPAL_ID,
            type: PrincipalType.CREDENTIAL_PROXY,
        }
    },
}

function digestsMatch({ presented, configured }: { presented: string, configured: string }): boolean {
    return timingSafeEqual(sha256(presented), sha256(configured))
}

function sha256(value: string): Buffer {
    return createHash('sha256').update(value).digest()
}

const BEARER_PREFIX = 'Bearer apcp_'

export const CREDENTIAL_PROXY_PRINCIPAL_ID = 'credential-proxy'
