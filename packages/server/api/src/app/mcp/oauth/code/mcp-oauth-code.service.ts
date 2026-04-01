import { randomBytes } from 'crypto'
import { apId, McpOAuthAuthorizationCode } from '@activepieces/shared'
import { repoFactory } from '../../../core/db/repo-factory'
import { McpOAuthAuthorizationCodeEntity } from './mcp-oauth-code.entity'

const repo = repoFactory(McpOAuthAuthorizationCodeEntity)

const CODE_TTL_10_MINUTES_MS = 10 * 60 * 1000

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
        await repo().save(entity)
        return code
    },

    async consume(code: string, clientId: string, redirectUri: string): Promise<McpOAuthAuthorizationCode | null> {
        const updateResult = await repo().createQueryBuilder()
            .update()
            .set({ used: true })
            .where('"code" = :code AND "used" = false AND "expiresAt" > NOW() AND "clientId" = :clientId AND "redirectUri" = :redirectUri', { code, clientId, redirectUri })
            .execute()

        if (updateResult.affected === 0) {
            return null
        }
        return repo().findOneByOrFail({ code })
    },
}

type CreateCodeParams = {
    clientId: string
    userId: string
    projectId: string
    platformId: string
    redirectUri: string
    codeChallenge: string
    codeChallengeMethod: string
    scopes?: string[]
    state?: string
}
