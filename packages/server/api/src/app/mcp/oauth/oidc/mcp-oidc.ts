import { isNil, spreadIfDefined } from '@activepieces/core-utils'
import { repoFactory } from '../../../core/db/repo-factory'
import { oidcKeyManager } from '../../../core/security/oidc/oidc-key-manager'
import { UserEntity } from '../../../user/user-entity'
import { EMAIL_SCOPE, OPENID_SCOPE, PROFILE_SCOPE } from '../mcp-oauth-scopes'
import { MCP_OAUTH_ID_TOKEN_TTL_SECONDS } from '../token/mcp-oauth-token-lifetimes'

const userRepo = repoFactory(UserEntity)

async function buildClaims({ userId, platformId, scopes }: BuildClaimsParams): Promise<OidcClaims | null> {
    const grantsEmail = scopes.includes(EMAIL_SCOPE) || scopes.includes(OPENID_SCOPE)
    const grantsProfile = scopes.includes(PROFILE_SCOPE)
    if (!grantsEmail && !grantsProfile) {
        return { sub: userId }
    }
    const user = await userRepo().findOne({
        where: { id: userId, platformId },
        relations: { identity: true },
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

export const mcpOidc = {
    getUserInfo: buildClaims,

    async issueIdToken({ userId, platformId, clientId, scopes, nonce, issuer }: IssueIdTokenParams): Promise<string | undefined> {
        if (!scopes.includes(OPENID_SCOPE)) {
            return undefined
        }
        const claims = await buildClaims({ userId, platformId, scopes })
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

type BuildClaimsParams = {
    userId: string
    platformId: string
    scopes: string[]
}

type IssueIdTokenParams = BuildClaimsParams & {
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
