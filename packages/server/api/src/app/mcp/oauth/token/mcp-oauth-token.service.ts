import { randomBytes } from 'crypto'
import { ActivepiecesError, apId, ErrorCode, isNil, sanitizeObjectForPostgresql, SeekPage, spreadIfDefined, unique } from '@activepieces/core-utils'
import { cryptoUtils } from '@activepieces/server-utils'
import { McpOAuthClientKey, McpOAuthGrant, McpOAuthToken, PLATFORM_WIDE_PROJECT_FILTER_VALUE, UserWithMetaInformation } from '@activepieces/shared'
import { Brackets, In, ObjectLiteral, SelectQueryBuilder } from 'typeorm'
import { repoFactory } from '../../../core/db/repo-factory'
import { JwtAudience, jwtUtils } from '../../../helper/jwt-utils'
import { buildPaginator } from '../../../helper/pagination/build-paginator'
import { paginationHelper } from '../../../helper/pagination/pagination-utils'
import { projectRepo } from '../../../project/project-repo'
import { mapToUserWithMetaInformation, userRepo } from '../../../user/user-service'
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
const TOKEN_ALIAS = 'mcp_oauth_token'
const UNKNOWN_CLIENT_KEY: McpOAuthClientKey = 'unknown'

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
            clientKey: mcpOAuthClientIdentity.detectClientKey({ redirectUris: params.redirectUris }),
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

        await repo().update({ id: record.id }, {
            lastUsedAt: new Date().toISOString(),
            ...spreadIfDefined('clientKey', isNil(record.clientKey) ? mcpOAuthClientIdentity.detectClientKey({ redirectUris: params.redirectUris }) : undefined),
        })

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

    async listGrants({ platformId, userId, projectIds, memberIds, clientKeys, cursor, limit }: ListGrantsParams): Promise<SeekPage<McpOAuthGrant>> {
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
        const queryBuilder = repo().createQueryBuilder(TOKEN_ALIAS)
        applyGrantScope(queryBuilder, { platformId, userId })
        if (!isNil(clientKeys)) {
            queryBuilder.andWhere(`COALESCE(${TOKEN_ALIAS}."clientKey", :unknownClientKey) IN (:...clientKeys)`, { clientKeys, unknownClientKey: UNKNOWN_CLIENT_KEY })
        }
        if (!isNil(memberIds)) {
            queryBuilder.andWhere(`${TOKEN_ALIAS}."userId" IN (:...memberIds)`, { memberIds })
        }
        applyProjectFilter(queryBuilder, projectIds)

        const { data, cursor: nextCursor } = await paginator.paginate(queryBuilder)

        const [clientNames, members, projectNames] = await Promise.all([
            findClientNames({ clientIds: data.filter((token) => isNil(token.clientKey) || token.clientKey === UNKNOWN_CLIENT_KEY).map((token) => token.clientId) }),
            findMembers({ userIds: data.map((token) => token.userId), platformId }),
            findProjectNames({ projectIds: data.map((token) => token.projectId), platformId }),
        ])

        const rows = data.map((token) => ({
            id: token.id,
            clientKey: token.clientKey ?? UNKNOWN_CLIENT_KEY,
            clientName: clientNames.get(token.clientId) ?? null,
            projectId: token.projectId,
            projectName: isNil(token.projectId) ? null : projectNames.get(token.projectId) ?? null,
            member: members.get(token.userId) ?? null,
            created: token.created,
            lastUsedAt: token.lastUsedAt,
        }))

        return paginationHelper.createPage<McpOAuthGrant>(rows, nextCursor)
    },

    async revokeGrants({ ids, userId, platformId }: RevokeGrantsParams): Promise<void> {
        const matched = await repo().findBy({ platformId, id: In(ids), ...spreadIfDefined('userId', userId ?? undefined) })
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

function applyGrantScope<T extends ObjectLiteral>(queryBuilder: SelectQueryBuilder<T>, { platformId, userId }: GrantScope): void {
    queryBuilder
        .where(`${TOKEN_ALIAS}."platformId" = :platformId`, { platformId })
        .andWhere(`${TOKEN_ALIAS}.revoked = false`)
        .andWhere(`${TOKEN_ALIAS}."expiresAt" > :now`, { now: new Date().toISOString() })
    if (!isNil(userId)) {
        queryBuilder.andWhere(`${TOKEN_ALIAS}."userId" = :userId`, { userId })
    }
}

function applyProjectFilter<T extends ObjectLiteral>(queryBuilder: SelectQueryBuilder<T>, projectIds: string[] | undefined): void {
    if (isNil(projectIds)) {
        return
    }
    const scopedProjectIds = projectIds.filter((projectId) => projectId !== PLATFORM_WIDE_PROJECT_FILTER_VALUE)
    const includesPlatformWide = projectIds.length !== scopedProjectIds.length
    queryBuilder.andWhere(new Brackets((qb) => {
        if (scopedProjectIds.length > 0) {
            qb.orWhere(`${TOKEN_ALIAS}."projectId" IN (:...scopedProjectIds)`, { scopedProjectIds })
        }
        if (includesPlatformWide) {
            qb.orWhere(`${TOKEN_ALIAS}."projectId" IS NULL`)
        }
    }))
}

async function findClientNames({ clientIds }: FindClientNamesParams): Promise<Map<string, string | null>> {
    const distinct = unique(clientIds)
    if (distinct.length === 0) {
        return new Map()
    }
    const clients = await clientRepo().findBy({ clientId: In(distinct) })
    return new Map(clients.map((client) => [client.clientId, client.clientName]))
}

async function findProjectNames({ projectIds, platformId }: FindProjectNamesParams): Promise<Map<string, string>> {
    const distinct = unique(projectIds.filter((projectId): projectId is string => !isNil(projectId)))
    if (distinct.length === 0) {
        return new Map()
    }
    const projects = await projectRepo().findBy({ id: In(distinct), platformId })
    return new Map(projects.map((project) => [project.id, project.displayName]))
}

async function findMembers({ userIds, platformId }: FindMembersParams): Promise<Map<string, UserWithMetaInformation>> {
    const distinct = unique(userIds)
    if (distinct.length === 0) {
        return new Map()
    }
    const users = await userRepo().find({ where: { id: In(distinct), platformId }, relations: { identity: true } })
    return new Map(users.flatMap((user) => {
        const member = mapToUserWithMetaInformation(user)
        return isNil(member) ? [] : [[user.id, member] as const]
    }))
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
    redirectUris: string[]
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

type FindClientNamesParams = {
    clientIds: string[]
}

type FindProjectNamesParams = {
    projectIds: (string | null)[]
    platformId: string
}

type FindMembersParams = {
    userIds: string[]
    platformId: string
}

type GrantScope = {
    platformId: string
    userId: string | null
}

type ListGrantsParams = GrantScope & {
    projectIds?: string[]
    memberIds?: string[]
    clientKeys?: McpOAuthClientKey[]
    cursor?: string
    limit?: number
}

type RevokeGrantsParams = GrantScope & {
    ids: string[]
}

type RefreshParams = {
    redirectUris: string[]
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
