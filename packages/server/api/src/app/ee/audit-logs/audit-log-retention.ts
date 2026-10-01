import { tryCatch } from '@activepieces/core-utils'
import { FastifyBaseLogger } from 'fastify'
import { z } from 'zod'
import { auditLogRetentionCeiling } from '../../helper/retention/audit-log-retention-ceiling'
import { auditLogRepo } from './audit-event-service'

export const auditLogRetention = (log: FastifyBaseLogger) => ({
    async sweep({
        batchSize = BATCH_SIZE,
        maxRowsPerPlatformPerRun = MAX_ROWS_PER_PLATFORM_PER_RUN,
        maxRowsPerRun = MAX_ROWS_PER_RUN,
        runBudgetMs = RUN_BUDGET_MS,
    }: SweepParams = {}): Promise<SweepSummary> {
        const startedAt = Date.now()
        const deadline = startedAt + runBudgetMs
        const platforms = await findPlatformsWithExpiredEvents({ ceiling: auditLogRetentionCeiling.get() })

        let deletedCount = 0
        let platformsAttempted = 0
        let platformsFailed = 0
        for (const { platformId, retentionDays } of platforms) {
            if (deletedCount >= maxRowsPerRun || Date.now() >= deadline) {
                break
            }
            platformsAttempted++
            const { data: deletedForPlatform, error } = await tryCatch(() => deleteExpiredEventsOfPlatform({
                platformId,
                retentionDays,
                batchSize,
                maxRows: Math.min(maxRowsPerPlatformPerRun, maxRowsPerRun - deletedCount),
                deadline,
            }))
            if (error) {
                platformsFailed++
                log.warn({ platform: { id: platformId }, error }, '[auditLogRetention#sweep] Failed to delete expired audit events')
                continue
            }
            deletedCount += deletedForPlatform
        }

        const summary: SweepSummary = {
            deletedCount,
            platformsDone: platformsAttempted - platformsFailed,
            platformsFailed,
            platformsLeft: platforms.length - platformsAttempted,
            durationMs: Date.now() - startedAt,
            stoppedBy: resolveStopReason({ deletedCount, maxRowsPerRun, deadline }),
        }
        if (platforms.length > 0) {
            log.info(summary, '[auditLogRetention#sweep] Completed')
        }
        return summary
    },
})

async function findPlatformsWithExpiredEvents({ ceiling }: { ceiling: number | null }): Promise<PlatformRetention[]> {
    const rows: unknown = await auditLogRepo().manager.transaction(async (entityManager) => {
        await entityManager.query(`SET LOCAL statement_timeout = ${PROBE_STATEMENT_TIMEOUT_MS}`)
        return entityManager.query(`
            SELECT p.id AS "platformId", LEAST(p."auditLogRetentionDays", $1::int) AS "retentionDays"
            FROM "platform" p
            WHERE LEAST(p."auditLogRetentionDays", $1::int) IS NOT NULL
              AND EXISTS (
                SELECT 1 FROM "audit_event" a
                WHERE a."platformId" = p.id
                  AND a.created < now() - make_interval(days => LEAST(p."auditLogRetentionDays", $1::int))
              )
            ORDER BY random()
        `, [ceiling])
    })
    return PlatformRetentionRows.parse(rows)
}

async function deleteExpiredEventsOfPlatform({ platformId, retentionDays, batchSize, maxRows, deadline }: DeleteExpiredEventsOfPlatformParams): Promise<number> {
    let deleted = 0
    while (deleted < maxRows && Date.now() < deadline) {
        const limit = Math.min(batchSize, maxRows - deleted)
        const deletedInBatch = await deleteOneBatch({ platformId, retentionDays, limit })
        deleted += deletedInBatch
        if (deletedInBatch < limit) {
            break
        }
    }
    return deleted
}

async function deleteOneBatch({ platformId, retentionDays, limit }: DeleteOneBatchParams): Promise<number> {
    return auditLogRepo().manager.transaction(async (entityManager) => {
        await entityManager.query(`SET LOCAL statement_timeout = ${BATCH_STATEMENT_TIMEOUT_MS}`)
        const result = await auditLogRepo(entityManager)
            .createQueryBuilder()
            .delete()
            .where(`id IN (
                SELECT id FROM "audit_event"
                WHERE "platformId" = :platformId
                  AND created < now() - make_interval(days => :retentionDays)
                ORDER BY created, id
                LIMIT :limit
                FOR UPDATE SKIP LOCKED
            )`, { platformId, retentionDays, limit })
            .returning('id')
            .execute()
        const deletedRows: unknown = result.raw
        return Array.isArray(deletedRows) ? deletedRows.length : 0
    })
}

function resolveStopReason({ deletedCount, maxRowsPerRun, deadline }: { deletedCount: number, maxRowsPerRun: number, deadline: number }): StopReason {
    if (deletedCount >= maxRowsPerRun) {
        return 'rowLimit'
    }
    if (Date.now() >= deadline) {
        return 'timeBudget'
    }
    return 'done'
}

const BATCH_SIZE = 5_000
const MAX_ROWS_PER_PLATFORM_PER_RUN = 100_000
const MAX_ROWS_PER_RUN = 1_000_000
const RUN_BUDGET_MS = 10 * 60 * 1000
const BATCH_STATEMENT_TIMEOUT_MS = 60 * 1000
const PROBE_STATEMENT_TIMEOUT_MS = 5 * 60 * 1000

const PlatformRetentionRows = z.array(z.object({
    platformId: z.string(),
    retentionDays: z.number().int().positive(),
}))

type PlatformRetention = z.infer<typeof PlatformRetentionRows>[number]

type StopReason = 'done' | 'rowLimit' | 'timeBudget'

type SweepParams = {
    batchSize?: number
    maxRowsPerPlatformPerRun?: number
    maxRowsPerRun?: number
    runBudgetMs?: number
}

type SweepSummary = {
    deletedCount: number
    platformsDone: number
    platformsFailed: number
    platformsLeft: number
    durationMs: number
    stoppedBy: StopReason
}

type DeleteExpiredEventsOfPlatformParams = {
    platformId: string
    retentionDays: number
    batchSize: number
    maxRows: number
    deadline: number
}

type DeleteOneBatchParams = {
    platformId: string
    retentionDays: number
    limit: number
}
