import { wideEvent } from '@activepieces/server-utils'
import { databaseConnection } from '../../database/database-connection'

async function deleteOlderThan({ table, timeColumn, cutoff, startedAt, deleted }: DeleteParams): Promise<number> {
    if (Date.now() - startedAt > RUN_BUDGET_MS) {
        return deleted
    }
    const rows: { deleted: number }[] = await databaseConnection().query(
        `WITH gone AS (
            DELETE FROM "${table}" WHERE ctid IN (SELECT ctid FROM "${table}" WHERE "${timeColumn}" < $1 LIMIT ${DELETE_BATCH_SIZE}) RETURNING 1
        ) SELECT count(*)::int AS "deleted" FROM gone`,
        [cutoff],
    )
    const batch = Number(rows[0]?.deleted ?? 0)
    if (batch < DELETE_BATCH_SIZE) {
        return deleted + batch
    }
    return deleteOlderThan({ table, timeColumn, cutoff, startedAt, deleted: deleted + batch })
}

const FIVE_MINUTE_RETENTION_MS = 3 * 24 * 60 * 60 * 1000
const RUN_RETENTION_MS = 24 * 60 * 60 * 1000
const DAILY_RETENTION_MONTHS = 13
const DELETE_BATCH_SIZE = 10_000
const RUN_BUDGET_MS = 60_000

export const aiUsageRetention = {
    async run(): Promise<void> {
        const startedAt = Date.now()
        const now = Date.now()
        const fiveMinuteDeleted = await deleteOlderThan({ table: 'ai_usage_5m', timeColumn: 'bucket', cutoff: new Date(now - FIVE_MINUTE_RETENTION_MS).toISOString(), startedAt, deleted: 0 })
        const dailyCutoff = new Date(now)
        dailyCutoff.setUTCMonth(dailyCutoff.getUTCMonth() - DAILY_RETENTION_MONTHS)
        const dailyDeleted = await deleteOlderThan({ table: 'ai_usage_daily', timeColumn: 'day', cutoff: dailyCutoff.toISOString().slice(0, 10), startedAt, deleted: 0 })
        const runsDeleted = await deleteOlderThan({ table: 'ai_usage_run', timeColumn: 'seenAt', cutoff: new Date(now - RUN_RETENTION_MS).toISOString(), startedAt, deleted: 0 })
        wideEvent.set({ aiUsageRetention: { fiveMinuteDeleted, dailyDeleted, runsDeleted, durationMs: Date.now() - startedAt } })
    },
}

type DeleteParams = {
    table: 'ai_usage_5m' | 'ai_usage_daily' | 'ai_usage_run'
    timeColumn: 'bucket' | 'day' | 'seenAt'
    cutoff: string
    startedAt: number
    deleted: number
}
