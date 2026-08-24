import { randomBytes } from 'crypto'
import { ActivepiecesError, apId, ErrorCode, isNil, sanitizeObjectForPostgresql, spreadIfDefined, unique } from '@activepieces/core-utils'
import { cryptoUtils } from '@activepieces/server-utils'
import { ListMcpOAuthGrantsResponse, McpOAuthClientKey, McpOAuthGrant, McpOAuthGrantFacets, McpOAuthToken, PLATFORM_WIDE_GRANT_FILTER_VALUE, PlatformRole, UserStatus, UserWithMetaInformation } from '@activepieces/shared'
import { Brackets, In, ObjectLiteral, SelectQueryBuilder } from 'typeorm'
import { repoFactory } from '../../../core/db/repo-factory'
import { JwtAudience, jwtUtils } from '../../../helper/jwt-utils'
import { buildPaginator } from '../../../helper/pagination/build-paginator'
import { paginationHelper } from '../../../helper/pagination/pagination-utils'
import { projectRepo } from '../../../project/project-repo'
import { userRepo } from '../../../user/user-service'
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

    async listGrants({ platformId, userId, projectIds, memberIds, clientKeys, cursor, limit }: ListGrantsParams): Promise<ListMcpOAuthGrantsResponse> {
        const scope = { platformId, userId }
        const groups = await countGrantsByGroup(scope)
        const [clients, members, projectNames] = await Promise.all([
            findClientsById(groups.map((group) => group.clientId)),
            findMembers(groups.map((group) => group.userId)),
            findProjectNames(groups.map((group) => group.projectId)),
        ])
        const clientKeyOf = (clientId: string): McpOAuthClientKey =>
            mcpOAuthClientIdentity.clientKeyFrom({ redirectUris: clients.get(clientId)?.redirectUris ?? [] })
        const facets = buildFacets({ groups, clients, members, projectNames, clientKeyOf })

        const clientIds = isNil(clientKeys)
            ? undefined
            : unique(groups.map((group) => group.clientId).filter((clientId) => clientKeys.includes(clientKeyOf(clientId))))
        if (!isNil(clientIds) && clientIds.length === 0) {
            return { ...paginationHelper.createPage<McpOAuthGrant>([], null), facets }
        }

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
        const queryBuilder = applyScope(repo().createQueryBuilder(TOKEN_ALIAS), scope)
        if (!isNil(clientIds)) {
            queryBuilder.andWhere(`${TOKEN_ALIAS}."clientId" IN (:...clientIds)`, { clientIds })
        }
        if (!isNil(memberIds)) {
            queryBuilder.andWhere(`${TOKEN_ALIAS}."userId" IN (:...memberIds)`, { memberIds })
        }
        applyProjectFilter(queryBuilder, projectIds)

        const { data, cursor: nextCursor } = await paginator.paginate(queryBuilder)

        const rows = data.map((token) => ({
            id: token.id,
            clientKey: clientKeyOf(token.clientId),
            clientName: clients.get(token.clientId)?.clientName ?? null,
            projectId: token.projectId,
            projectName: isNil(token.projectId) ? null : projectNames.get(token.projectId) ?? null,
            member: members.get(token.userId) ?? unknownMember(token.userId),
            created: token.created,
            lastUsedAt: token.lastUsedAt,
        }))

        return { ...paginationHelper.createPage<McpOAuthGrant>(rows, nextCursor), facets }
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

function applyScope<T extends ObjectLiteral>(queryBuilder: SelectQueryBuilder<T>, { platformId, userId }: GrantScope): SelectQueryBuilder<T> {
    queryBuilder
        .where(`${TOKEN_ALIAS}."platformId" = :platformId`, { platformId })
        .andWhere(`${TOKEN_ALIAS}.revoked = false`)
        .andWhere(`${TOKEN_ALIAS}."expiresAt" > :now`, { now: new Date().toISOString() })
    if (!isNil(userId)) {
        queryBuilder.andWhere(`${TOKEN_ALIAS}."userId" = :userId`, { userId })
    }
    return queryBuilder
}

function applyProjectFilter<T extends ObjectLiteral>(queryBuilder: SelectQueryBuilder<T>, projectIds: string[] | undefined): void {
    if (isNil(projectIds)) {
        return
    }
    const includesPlatformWide = projectIds.includes(PLATFORM_WIDE_GRANT_FILTER_VALUE)
    const scopedProjectIds = projectIds.filter((projectId) => projectId !== PLATFORM_WIDE_GRANT_FILTER_VALUE)
    queryBuilder.andWhere(new Brackets((qb) => {
        if (scopedProjectIds.length > 0) {
            qb.orWhere(`${TOKEN_ALIAS}."projectId" IN (:...scopedProjectIds)`, { scopedProjectIds })
        }
        if (includesPlatformWide) {
            qb.orWhere(`${TOKEN_ALIAS}."projectId" IS NULL`)
        }
        if (scopedProjectIds.length === 0 && !includesPlatformWide) {
            qb.orWhere('1 = 0')
        }
    }))
}

async function countGrantsByGroup(scope: GrantScope): Promise<GrantGroupCount[]> {
    const rows = await applyScope(repo().createQueryBuilder(TOKEN_ALIAS), scope)
        .select(`${TOKEN_ALIAS}."clientId"`, 'clientId')
        .addSelect(`${TOKEN_ALIAS}."userId"`, 'userId')
        .addSelect(`${TOKEN_ALIAS}."projectId"`, 'projectId')
        .addSelect('COUNT(*)', 'count')
        .groupBy(`${TOKEN_ALIAS}."clientId"`)
        .addGroupBy(`${TOKEN_ALIAS}."userId"`)
        .addGroupBy(`${TOKEN_ALIAS}."projectId"`)
        .getRawMany<{ clientId: string, userId: string, projectId: string | null, count: string }>()
    return rows.map((row) => ({ ...row, count: Number(row.count) }))
}

function buildFacets({ groups, clients, members, projectNames, clientKeyOf }: BuildFacetsParams): McpOAuthGrantFacets {
    const byClient = new Map<McpOAuthClientKey, { clientName: string | null, count: number }>()
    const byMember = new Map<string, number>()
    const byProject = new Map<string, number>()

    for (const group of groups) {
        const clientKey = clientKeyOf(group.clientId)
        const client = byClient.get(clientKey)
        byClient.set(clientKey, {
            clientName: client?.clientName ?? clients.get(group.clientId)?.clientName ?? null,
            count: (client?.count ?? 0) + group.count,
        })
        byMember.set(group.userId, (byMember.get(group.userId) ?? 0) + group.count)
        const projectKey = group.projectId ?? PLATFORM_WIDE_GRANT_FILTER_VALUE
        byProject.set(projectKey, (byProject.get(projectKey) ?? 0) + group.count)
    }

    return {
        total: groups.reduce((total, group) => total + group.count, 0),
        byClient: [...byClient].map(([clientKey, { clientName, count }]) => ({ clientKey, clientName, count })),
        byMember: [...byMember].map(([userId, count]) => ({ member: members.get(userId) ?? unknownMember(userId), count })),
        byProject: [...byProject].map(([projectKey, count]) => ({
            projectId: projectKey === PLATFORM_WIDE_GRANT_FILTER_VALUE ? null : projectKey,
            projectName: projectNames.get(projectKey) ?? null,
            count,
        })),
    }
}

async function findClientsById(clientIds: string[]): Promise<Map<string, { redirectUris: string[], clientName: string | null }>> {
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

async function findMembers(userIds: string[]): Promise<Map<string, UserWithMetaInformation>> {
    const distinct = unique(userIds)
    if (distinct.length === 0) {
        return new Map()
    }
    const users = await userRepo().find({ where: { id: In(distinct) }, relations: { identity: true } })
    return new Map(users.flatMap((user) => {
        const identity = user.identity
        if (isNil(identity)) {
            return []
        }
        return [[user.id, {
            id: user.id,
            email: identity.email,
            firstName: identity.firstName,
            lastName: identity.lastName,
            platformId: user.platformId,
            platformRole: user.platformRole,
            status: user.status,
            externalId: user.externalId,
            created: user.created,
            updated: user.updated,
            lastActiveDate: user.lastActiveDate,
            imageUrl: identity.imageUrl,
        }] as const]
    }))
}

function unknownMember(userId: string): UserWithMetaInformation {
    return {
        id: userId,
        email: '',
        firstName: '',
        lastName: '',
        platformId: null,
        platformRole: PlatformRole.MEMBER,
        status: UserStatus.INACTIVE,
        externalId: null,
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
        lastActiveDate: null,
        imageUrl: null,
    }
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

type GrantScope = {
    platformId: string
    userId: string | null
}

type GrantGroupCount = {
    clientId: string
    userId: string
    projectId: string | null
    count: number
}

type BuildFacetsParams = {
    groups: GrantGroupCount[]
    clients: Map<string, { redirectUris: string[], clientName: string | null }>
    members: Map<string, UserWithMetaInformation>
    projectNames: Map<string, string>
    clientKeyOf: (clientId: string) => McpOAuthClientKey
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
