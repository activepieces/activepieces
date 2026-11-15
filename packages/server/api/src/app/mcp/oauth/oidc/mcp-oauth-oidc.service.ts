import { isNil, spreadIfDefined } from '@activepieces/core-utils'
import { repoFactory } from '../../../core/db/repo-factory'
import { oidcKeyManager } from '../../../core/security/oidc/oidc-key-manager'
import { UserEntity } from '../../../user/user-entity'
import { MCP_OAUTH_ID_TOKEN_TTL_SECONDS } from '../token/mcp-oauth-token-lifetimes'

const userRepo = repoFactory(UserEntity)

async function getUserInfo({ userId, platformId, scopes }: UserInfoParams): Promise<OidcClaims | null> {
    const grantsEmail = scopes.includes('email') || scopes.includes('openid')
    const grantsProfile = scopes.includes('profile')
    if (!grantsEmail && !grantsProfile) {
        return { sub: userId }
    }
    const user = await userRepo().findOne({
        where: { id: userId, platformId },
        relations: { identity: true },
        select: { id: true, identity: { email: true, verified: true, firstName: true, lastName: true } },
    })
    if (isNil(user)) {
        return null
    }
    const { identity } = user
    return {
        sub: userId,
        ...spreadIfDefined('email', grantsEmail ? identity.email : undefined),
        ...spreadIfDefined('email_verified', grantsEmail ? identity.verified : undefined),
        ...spreadIfDefined('name', grantsProfile ? `${identity.firstName} ${identity.lastName}`.trim() : undefined),
        ...spreadIfDefined('given_name', grantsProfile ? identity.firstName : undefined),
        ...spreadIfDefined('family_name', grantsProfile ? identity.lastName : undefined),
    }
}

export const mcpOAuthOidcService = {
    getUserInfo,

    async issueIdToken({ userId, platformId, clientId, scopes, nonce, issuer }: IssueIdTokenParams): Promise<string | undefined> {
        if (!scopes.includes('openid')) {
            return undefined
        }
        const claims = await getUserInfo({ userId, platformId, scopes })
        if (isNil(claims)) {
            return undefined
        }
        return oidcKeyManager.sign({
            payload: {
                ...claims,
                aud: clientId,
                ...spreadIfDefined('nonce', nonce ?? undefined),
            },
            expiresInSeconds: MCP_OAUTH_ID_TOKEN_TTL_SECONDS,
            issuer,
        })
    },
}

type UserInfoParams = {
    userId: string
    platformId: string
    scopes: string[]
}

type IssueIdTokenParams = UserInfoParams & {
    clientId: string
    nonce: string | null
    issuer: string
}

type OidcClaims = {
    sub: string
    email?: string
    email_verified?: boolean
    name?: string
    given_name?: string
    family_name?: string
}
