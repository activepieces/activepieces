import { randomBytes } from 'crypto'
import { apId, sanitizeObjectForPostgresql } from '@activepieces/core-utils'
import { McpOAuthAuthorizationCode } from '@activepieces/shared'
import { repoFactory } from '../../../core/db/repo-factory'
import { McpOAuthAuthorizationCodeEntity } from './mcp-oauth-code.entity'

const repo = repoFactory(McpOAuthAuthorizationCodeEntity)

const CODE_TTL_10_MINUTES_MS = 10 * 60 * 1000

const CODE_PATTERN = /^[A-Za-z0-9_-]{1,128}$/

function generateCode(): string {
    return randomBytes(48).toString('base64url')
}

export const mcpOAuthCodeService = {
    async create(params: CreateCodeParams): Promise<string> {
        const code = generateCode()
        const entity: McpOAuthAuthorizationCode = {
            id: apId(),
            code,
            clientId: params.clientId,
            userId: params.userId,
            projectId: params.projectId,
            platformId: params.platformId,
            redirectUri: params.redirectUri,
            codeChallenge: params.codeChallenge,
            codeChallengeMethod: params.codeChallengeMethod,
            scopes: params.scopes ?? [],
            state: params.state ?? null,
            expiresAt: new Date(Date.now() + CODE_TTL_10_MINUTES_MS).toISOString(),
            used: false,
            created: new Date().toISOString(),
            updated: new Date().toISOString(),
        }
        await repo().save(sanitizeObjectForPostgresql(entity))
        return code
    },

    async consume({ code, clientId, redirectUri }: ConsumeCodeParams): Promise<McpOAuthAuthorizationCode | null> {
        if (!CODE_PATTERN.test(code)) {
            return null
        }
        const updateResult = await repo().createQueryBuilder()
            .update()
            .set({ used: true })
            .where('"code" = :code AND "used" = false AND "expiresAt" > NOW() AND "clientId" = :clientId AND "redirectUri" = :redirectUri', { code, clientId, redirectUri })
            .returning('*')
            .execute()

        const consumedRows: unknown[] = updateResult.raw ?? []
        if (consumedRows.length === 0) {
            return null
        }
        return repo().findOneBy({ code })
    },
}

type ConsumeCodeParams = {
    code: string
    clientId: string
    redirectUri: string
}

type CreateCodeParams = {
    clientId: string
    userId: string
    projectId: string | null
    platformId: string
    redirectUri: string
    codeChallenge: string
    codeChallengeMethod: string
    scopes?: string[]
    state?: string
}
