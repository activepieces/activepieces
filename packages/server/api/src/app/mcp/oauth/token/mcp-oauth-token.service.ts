import { randomBytes } from 'crypto'
import { ActivepiecesError, apId, ErrorCode, isNil, sanitizeObjectForPostgresql, SeekPage, unique } from '@activepieces/core-utils'
import { cryptoUtils } from '@activepieces/server-utils'
import { McpOAuthClientRow, McpOAuthToken } from '@activepieces/shared'
import { In } from 'typeorm'
import { repoFactory } from '../../../core/db/repo-factory'
import { JwtAudience, jwtUtils } from '../../../helper/jwt-utils'
import { buildPaginator } from '../../../helper/pagination/build-paginator'
import { paginationHelper } from '../../../helper/pagination/pagination-utils'
import { projectRepo } from '../../../project/project-repo'
import { mcpOAuthClientIdentity } from '../client/mcp-oauth-client-identity'
import { McpOAuthClientEntity } from '../client/mcp-oauth-client.entity'
import { mcpOAuthPkce } from '../mcp-oauth.pkce'
import { McpOAuthTokenEntity } from './mcp-oauth-token.entity'

const repo = repoFactory(McpOAuthTokenEntity)
const clientRepo = repoFactory(McpOAuthClientEntity)

const ACCESS_TOKEN_TTL_15_MINUTES_SECONDS = 15 * 60
const REFRESH_TOKEN_TTL_30_DAYS_MS = 30 * 24 * 60 * 60 * 1000
const INTERNAL_CHAT_CLIENT_ID = 'internal-chat'
const DEFAULT_GRANT_PAGE_SIZE = 20

function generateRefreshToken(): string {
    return randomBytes(48).toString('base64url')
}

function hashRefreshToken(token: string): string {
    return cryptoUtils.hashSHA256(token)
}

async function issueAccessToken(params: IssueAccessTokenParams): Promise<string> {
    const key = await jwtUtils.getJwtSecret()
    return jwtUtils.sign({
        payload: {
            sub: params.userId,
            projectId: params.projectId,
            platformId: params.platformId,
            clientId: params.clientId,
            scopes: params.scopes,
            type: 'mcp_oauth',
        },
        key,
        expiresInSeconds: ACCESS_TOKEN_TTL_15_MINUTES_SECONDS,
        audience: JwtAudience.MCP_OAUTH_ACCESS,
    })
}

export const mcpOAuthTokenService = {
    async exchangeCode(params: ExchangeCodeParams): Promise<TokenResponse> {
        const valid = mcpOAuthPkce.verify(params.codeVerifier, params.codeChallenge, params.codeChallengeMethod)
        if (!valid) {
            throw new OAuthTokenError('invalid_grant', 'PKCE verification failed')
        }

        const rawRefreshToken = generateRefreshToken()
        const hashedRefreshToken = hashRefreshToken(rawRefreshToken)

        const tokenRecord: McpOAuthToken = {
            id: apId(),
            refreshToken: hashedRefreshToken,
            clientId: params.clientId,
            userId: params.userId,
            projectId: params.projectId,
            platformId: params.platformId,
            scopes: params.scopes,
            expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_30_DAYS_MS).toISOString(),
            revoked: false,
            lastUsedAt: null,
            created: new Date().toISOString(),
            updated: new Date().toISOString(),
        }
        await repo().save(sanitizeObjectForPostgresql(tokenRecord))

        const accessToken = await issueAccessToken({
            userId: params.userId,
            projectId: params.projectId,
            platformId: params.platformId,
            clientId: params.clientId,
            scopes: params.scopes,
        })

        return {
            access_token: accessToken,
            token_type: 'Bearer',
            expires_in: ACCESS_TOKEN_TTL_15_MINUTES_SECONDS,
            refresh_token: rawRefreshToken,
        }
    },

    async refreshAccessToken(params: RefreshParams): Promise<TokenResponse> {
        const hashed = hashRefreshToken(params.refreshToken)
        const record = await repo().findOneBy({ refreshToken: hashed })
        if (!record || record.revoked || new Date(record.expiresAt) < new Date()) {
            throw new OAuthTokenError('invalid_grant', 'Invalid or expired refresh token')
        }
        if (record.clientId !== params.clientId) {
            throw new OAuthTokenError('invalid_grant', 'Client mismatch')
        }

        await repo().update({ id: record.id }, { lastUsedAt: new Date().toISOString() })

        const accessToken = await issueAccessToken({
            userId: record.userId,
            projectId: record.projectId,
            platformId: record.platformId,
            clientId: record.clientId,
            scopes: record.scopes ?? [],
        })

        return {
            access_token: accessToken,
            token_type: 'Bearer',
            expires_in: ACCESS_TOKEN_TTL_15_MINUTES_SECONDS,
            refresh_token: params.refreshToken,
        }
    },

    async verifyAccessToken(token: string): Promise<McpOAuthAccessTokenPayload> {
        const key = await jwtUtils.getJwtSecret()
        const payload = await jwtUtils.decodeAndVerify<McpOAuthAccessTokenPayload>({
            jwt: token,
            key,
            audience: JwtAudience.MCP_OAUTH_ACCESS,
        })
        if (payload.type !== 'mcp_oauth') {
            throw new OAuthTokenError('invalid_token', 'Not an MCP OAuth token')
        }
        return payload
    },

    async revokeRefreshToken({ refreshToken, clientId }: RevokeRefreshTokenParams): Promise<void> {
        await repo().update({ refreshToken: hashRefreshToken(refreshToken), clientId }, { revoked: true })
    },

    async listForUser({ userId, platformId, cursor, limit }: ListForUserParams): Promise<SeekPage<McpOAuthClientRow>> {
        const decodedCursor = paginationHelper.decodeCursor(cursor ?? null)
        const paginator = buildPaginator({
            entity: McpOAuthTokenEntity,
            query: {
                limit: limit ?? DEFAULT_GRANT_PAGE_SIZE,
                order: 'DESC',
                afterCursor: decodedCursor.nextCursor,
                beforeCursor: decodedCursor.previousCursor,
            },
        })
        const queryBuilder = repo()
            .createQueryBuilder('mcp_oauth_token')
            .where({ userId, platformId, revoked: false })
            .andWhere('mcp_oauth_token."expiresAt" > :now', { now: new Date().toISOString() })

        const { data, cursor: nextCursor } = await paginator.paginate(queryBuilder)

        const clients = await findClientsByClientId(data.map((token) => token.clientId))
        const projectNames = await findProjectNames(data.map((token) => token.projectId))

        const rows = data.map((token) => {
            const client = clients.get(token.clientId)
            const identity = mcpOAuthClientIdentity.classify({ redirectUris: client?.redirectUris ?? [] })
            return {
                id: token.id,
                clientKey: identity.key,
                clientName: client?.clientName ?? null,
                connectsFrom: identity.connectsFrom,
                projectId: token.projectId,
                projectName: isNil(token.projectId) ? null : projectNames.get(token.projectId) ?? null,
                created: token.created,
                lastUsedAt: token.lastUsedAt,
            }
        })

        return paginationHelper.createPage<McpOAuthClientRow>(rows, nextCursor)
    },

    async revokeForUser({ ids, userId, platformId }: RevokeForUserParams): Promise<void> {
        const matched = await repo().findBy({ userId, platformId, id: In(ids) })
        if (matched.length !== unique(ids).length) {
            throw new ActivepiecesError({
                code: ErrorCode.AUTHORIZATION,
                params: { message: 'One or more grants do not exist or are not yours to revoke' },
            })
        }
        await repo().update({ id: In(matched.map((token) => token.id)) }, { revoked: true })
    },

    async issueInternalAccessToken({ userId, platformId, projectId }: { userId: string, platformId: string, projectId: string | null }): Promise<string> {
        return issueAccessToken({ userId, platformId, projectId, clientId: INTERNAL_CHAT_CLIENT_ID, scopes: ['mcp'] })
    },
}

async function findClientsByClientId(clientIds: string[]): Promise<Map<string, { redirectUris: string[], clientName: string | null }>> {
    const distinct = unique(clientIds)
    if (distinct.length === 0) {
        return new Map()
    }
    const clients = await clientRepo().findBy({ clientId: In(distinct) })
    return new Map(clients.map((client) => [client.clientId, { redirectUris: client.redirectUris, clientName: client.clientName }]))
}

async function findProjectNames(projectIds: (string | null)[]): Promise<Map<string, string>> {
    const distinct = unique(projectIds.filter((projectId): projectId is string => !isNil(projectId)))
    if (distinct.length === 0) {
        return new Map()
    }
    const projects = await projectRepo().findBy({ id: In(distinct) })
    return new Map(projects.map((project) => [project.id, project.displayName]))
}

export class OAuthTokenError extends Error {
    constructor(
        public readonly errorCode: string,
        public readonly errorDescription: string,
    ) {
        super(errorDescription)
    }
}

type IssueAccessTokenParams = {
    userId: string
    projectId: string | null
    platformId: string
    clientId: string
    scopes: string[]
}

type ExchangeCodeParams = {
    codeVerifier: string
    codeChallenge: string
    codeChallengeMethod: string
    clientId: string
    userId: string
    projectId: string | null
    platformId: string
    scopes: string[]
}

type RevokeRefreshTokenParams = {
    refreshToken: string
    clientId: string
}

type ListForUserParams = {
    userId: string
    platformId: string
    cursor?: string
    limit?: number
}

type RevokeForUserParams = {
    ids: string[]
    userId: string
    platformId: string
}

type RefreshParams = {
    refreshToken: string
    clientId: string
}

type TokenResponse = {
    access_token: string
    token_type: string
    expires_in: number
    refresh_token?: string
}

export type McpOAuthAccessTokenPayload = {
    sub: string
    projectId: string | null
    platformId: string
    clientId: string
    scopes: string[]
    type: 'mcp_oauth'
    iat: number
    exp: number
}
