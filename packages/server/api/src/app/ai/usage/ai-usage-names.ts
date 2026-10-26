import { isNil } from '@activepieces/core-utils'
import { AiUsageDimension } from '@activepieces/shared'
import { databaseConnection } from '../../database/database-connection'

async function namesOf({ platformId, dimension, ids }: { platformId: string, dimension: AiUsageDimension, ids: string[] }): Promise<NamedEntity[]> {
    const sql = NAME_QUERIES[dimension]
    if (isNil(sql) || ids.length === 0) {
        return []
    }
    return databaseConnection().query<NamedEntity[]>(sql, [platformId, ids])
}

const NAME_QUERIES: Partial<Record<AiUsageDimension, string>> = {
    project: `SELECT p."id", p."displayName" AS "name", NULL AS "parent", NULL AS "provider"
        FROM "project" p WHERE p."platformId" = $1 AND p."id" = ANY($2)`,
    flow: `SELECT DISTINCT ON (fv."flowId") fv."flowId" AS "id", fv."displayName" AS "name", p."displayName" AS "parent", NULL AS "provider"
        FROM "flow_version" fv
        JOIN "flow" f ON f."id" = fv."flowId"
        JOIN "project" p ON p."id" = f."projectId"
        WHERE p."platformId" = $1 AND fv."flowId" = ANY($2)
        ORDER BY fv."flowId", fv."created" DESC`,
    agent: `SELECT a."id", a."displayName" AS "name", p."displayName" AS "parent", NULL AS "provider"
        FROM "agent" a JOIN "project" p ON p."id" = a."projectId"
        WHERE p."platformId" = $1 AND a."id" = ANY($2)`,
    user: `SELECT u."id", nullif(trim(concat_ws(' ', ui."firstName", ui."lastName")), '') AS "name", ui."email" AS "parent", NULL AS "provider"
        FROM "user" u JOIN "user_identity" ui ON ui."id" = u."identityId"
        WHERE u."platformId" = $1 AND u."id" = ANY($2)`,
    key: `SELECT k."id", k."displayName" AS "name", NULL AS "parent", k."provider"
        FROM "ai_provider" k WHERE k."platformId" = $1 AND k."id" = ANY($2)`,
}

export const aiUsageNames = {
    async lookup({ platformId, ids }: { platformId: string, ids: Partial<Record<AiUsageDimension, string[]>> }): Promise<NameBook> {
        const entries = await Promise.all(Object.entries(ids).map(async ([dimension, dimensionIds]) => {
            const named = await namesOf({ platformId, dimension: AiUsageDimension.parse(dimension), ids: dimensionIds ?? [] })
            return named.map((entity): [string, NamedEntity] => [`${dimension}:${entity.id}`, entity])
        }))
        const book = new Map(entries.flat())
        return {
            of: ({ dimension, id }) => book.get(`${dimension}:${id}`),
        }
    },
}

export type NamedEntity = {
    id: string
    name: string | null
    parent: string | null
    provider: string | null
}

export type NameBook = {
    of: (params: { dimension: AiUsageDimension, id: string }) => NamedEntity | undefined
}
