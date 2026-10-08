import { isNil, tryCatch } from '@activepieces/core-utils'
import { AUDIT_LOG_RETENTION_BACKLOG_GRACE_DAYS } from '@activepieces/shared'
import dayjs from 'dayjs'
import { FastifyBaseLogger } from 'fastify'
import { EntityManager } from 'typeorm'
import { z } from 'zod'
import { auditLogRetentionCeiling } from '../../helper/retention/audit-log-retention-ceiling'
import { sleep } from '../../helper/sleep'
import { system } from '../../helper/system/system'
import { AppSystemProp } from '../../helper/system/system-props'
import { auditLogRepo } from './audit-event-service'

export const auditLogRetention = (log: FastifyBaseLogger) => ({
    async sweep({
        batchSize = BATCH_SIZE,
        maxRowsPerPlatformPerRound = MAX_ROWS_PER_PLATFORM_PER_ROUND,
        maxRowsPerRun = MAX_ROWS_PER_RUN,
        runBudgetMs = RUN_BUDGET_MS,
    }: SweepParams = {}): Promise<SweepSummary> {
        const startedAt = Date.now()
        if (system.getBoolean(AppSystemProp.AUDIT_LOG_RETENTION_PAUSED) === true) {
            log.info('[auditLogRetention#sweep] Paused by AP_AUDIT_LOG_RETENTION_PAUSED')
            return summarize({ progress: [], deletedCount: 0, maxRowsPerRun, startedAt, paused: true })
        }
        const deadline = startedAt + runBudgetMs
        const ceiling = auditLogRetentionCeiling.get()
        const platformIds = await findPlatformsWithExpiredEvents({ ceiling })
        if (platformIds.length === 0) {
            return summarize({ progress: [], deletedCount: 0, maxRowsPerRun, startedAt, paused: false })
        }
        await ensureAutovacuumScaleFactor({ log })

        const progress = new Map(platformIds.map((platformId) => [platformId, startProgress(platformId)]))
        let deletedCount = 0
        let pendingIds = platformIds
        while (pendingIds.length > 0 && deletedCount < maxRowsPerRun && Date.now() < deadline) {
            for (const platformId of pendingIds) {
                if (deletedCount >= maxRowsPerRun || Date.now() >= deadline) {
                    break
                }
                const previous = progress.get(platformId) ?? startProgress(platformId)
                const pass = await deleteExpiredEventsOfPlatform({
                    platformId,
                    ceiling,
                    cursor: previous.cursor,
                    batchSize,
                    maxRows: Math.min(maxRowsPerPlatformPerRound, maxRowsPerRun - deletedCount),
                    deadline,
                })
                deletedCount += pass.deleted
                progress.set(platformId, advanceProgress({ previous, pass }))
                if (!isNil(pass.error)) {
                    log.warn({ platform: { id: platformId }, deletedCount: pass.deleted, error: pass.error }, '[auditLogRetention#sweep] Failed to delete expired audit events')
                }
            }
            pendingIds = pendingIds.filter((platformId) => progress.get(platformId)?.status === 'pending')
        }

        const finalProgress = [...progress.values()]
        const summary = summarize({ progress: finalProgress, deletedCount, maxRowsPerRun, startedAt, paused: false })
        log.info(summary, '[auditLogRetention#sweep] Completed')
        const behind = findPlatformsBehind(finalProgress)
        if (behind.length > 0) {
            log.warn({
                platformsBehind: behind.length,
                platforms: behind.slice(0, MAX_PLATFORMS_IN_BACKLOG_WARNING),
            }, '[auditLogRetention#sweep] Deletion is behind the retention period')
        }
        return summary
    },
})

async function findPlatformsWithExpiredEvents({ ceiling }: { ceiling: number | null }): Promise<string[]> {
    const rows: unknown = await auditLogRepo().manager.transaction(async (entityManager) => {
        await entityManager.query(`SET LOCAL statement_timeout = ${PROBE_STATEMENT_TIMEOUT_MS}`)
        return entityManager.query(`
            SELECT p.id AS "platformId"
            FROM "platform" p
            LEFT JOIN "platform_plan" pp ON pp."platformId" = p.id
            WHERE ${EFFECTIVE_RETENTION_DAYS_SQL} IS NOT NULL
              AND EXISTS (
                SELECT 1 FROM "audit_event" a
                WHERE a."platformId" = p.id
                  AND a.created < now() - make_interval(days => ${EFFECTIVE_RETENTION_DAYS_SQL})
              )
            ORDER BY random()
        `, [ceiling])
    })
    return PlatformIdRows.parse(rows).map((row) => row.platformId)
}

async function ensureAutovacuumScaleFactor({ log }: { log: FastifyBaseLogger }): Promise<void> {
    const { error } = await tryCatch(() => auditLogRepo().manager.transaction(async (entityManager) => {
        const rows: unknown = await entityManager.query('SELECT reloptions FROM pg_class WHERE oid = \'"audit_event"\'::regclass')
        const options = TableOptionRows.parse(rows)[0]?.reloptions ?? []
        if (options.some((option) => option.startsWith(`${AUTOVACUUM_SCALE_FACTOR_OPTION}=`))) {
            return
        }
        await entityManager.query(`SET LOCAL lock_timeout = ${AUTOVACUUM_LOCK_TIMEOUT_MS}`)
        await entityManager.query(`ALTER TABLE "audit_event" SET (${AUTOVACUUM_SCALE_FACTOR_OPTION} = ${AUTOVACUUM_SCALE_FACTOR})`)
        log.info({ autovacuumScaleFactor: AUTOVACUUM_SCALE_FACTOR }, '[auditLogRetention#sweep] Set the autovacuum scale factor of audit_event')
    }))
    if (!isNil(error)) {
        log.info({ error }, '[auditLogRetention#sweep] Could not set the autovacuum scale factor of audit_event, will retry on the next run')
    }
}

async function deleteExpiredEventsOfPlatform({ platformId, ceiling, cursor, batchSize, maxRows, deadline }: DeleteExpiredEventsOfPlatformParams): Promise<PlatformPass> {
    let deleted = 0
    let lastDeleted = cursor
    let retentionDays: number | null = null
    while (deleted < maxRows && Date.now() < deadline) {
        const limit = Math.min(batchSize, maxRows - deleted)
        const batchStartedAt = Date.now()
        const { data: batch, error } = await tryCatch(() => deleteOneBatch({ platformId, ceiling, cursor: lastDeleted, limit }))
        if (error) {
            return { deleted, cursor: lastDeleted, retentionDays, outcome: 'failed', error }
        }
        deleted += batch.deletedCount
        lastDeleted = batch.lastDeleted ?? lastDeleted
        retentionDays = batch.retentionDays
        if (batch.deletedCount < limit) {
            return { deleted, cursor: lastDeleted, retentionDays, outcome: 'finished' }
        }
        await sleep(Date.now() - batchStartedAt)
    }
    return { deleted, cursor: lastDeleted, retentionDays, outcome: deleted >= maxRows ? 'capped' : 'stopped' }
}

async function deleteOneBatch({ platformId, ceiling, cursor, limit }: DeleteOneBatchParams): Promise<BatchResult> {
    return auditLogRepo().manager.transaction(async (entityManager) => {
        await entityManager.query(`SET LOCAL statement_timeout = ${BATCH_STATEMENT_TIMEOUT_MS}`)
        const retentionDays = await lockRetentionDays({ entityManager, platformId, ceiling })
        if (isNil(retentionDays)) {
            return { deletedCount: 0, lastDeleted: null, retentionDays }
        }
        const rows: unknown = await entityManager.query(`
            WITH deleted AS (
                DELETE FROM "audit_event"
                WHERE id IN (
                    SELECT id FROM "audit_event"
                    WHERE "platformId" = $1
                      AND created < now() - make_interval(days => $2)
                      ${isNil(cursor) ? '' : 'AND created >= $4 AND (created, id) > ($4, $5)'}
                    ORDER BY created, id
                    LIMIT $3
                    FOR UPDATE SKIP LOCKED
                )
                RETURNING id, created
            )
            SELECT
                id,
                to_char(created AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"') AS created,
                count(*) OVER ()::int AS "deletedCount"
            FROM deleted
            ORDER BY deleted.created DESC, id DESC
            LIMIT 1
        `, isNil(cursor) ? [platformId, retentionDays, limit] : [platformId, retentionDays, limit, cursor.created, cursor.id])
        const last = LastDeletedRows.parse(rows)[0]
        return {
            deletedCount: last?.deletedCount ?? 0,
            lastDeleted: isNil(last) ? null : { id: last.id, created: last.created },
            retentionDays,
        }
    })
}

async function lockRetentionDays({ entityManager, platformId, ceiling }: { entityManager: EntityManager, platformId: string, ceiling: number | null }): Promise<number | null> {
    const rows: unknown = await entityManager.query(`
        SELECT ${EFFECTIVE_RETENTION_DAYS_SQL} AS "retentionDays"
        FROM "platform" p
        LEFT JOIN "platform_plan" pp ON pp."platformId" = p.id
        WHERE p.id = $2
        FOR SHARE OF p
    `, [ceiling, platformId])
    return RetentionDaysRows.parse(rows)[0]?.retentionDays ?? null
}

function startProgress(platformId: string): PlatformProgress {
    return { platformId, deleted: 0, cursor: null, retentionDays: null, status: 'pending' }
}

function advanceProgress({ previous, pass }: { previous: PlatformProgress, pass: PlatformPass }): PlatformProgress {
    return {
        platformId: previous.platformId,
        deleted: previous.deleted + pass.deleted,
        cursor: pass.cursor,
        retentionDays: pass.retentionDays ?? previous.retentionDays,
        status: toStatus(pass.outcome),
    }
}

function toStatus(outcome: PassOutcome): PlatformStatus {
    switch (outcome) {
        case 'finished':
            return 'done'
        case 'failed':
            return 'failed'
        case 'capped':
        case 'stopped':
            return 'pending'
    }
}

function findPlatformsBehind(progress: PlatformProgress[]): PlatformBacklog[] {
    return progress
        .flatMap((entry) => {
            if (entry.status !== 'pending' || isNil(entry.cursor) || isNil(entry.retentionDays)) {
                return []
            }
            const daysBehind = dayjs().diff(dayjs(entry.cursor.created), 'day') - entry.retentionDays
            return daysBehind > AUDIT_LOG_RETENTION_BACKLOG_GRACE_DAYS
                ? [{ platform: { id: entry.platformId }, retentionDays: entry.retentionDays, deletedUpTo: entry.cursor.created, daysBehind }]
                : []
        })
        .sort((a, b) => b.daysBehind - a.daysBehind)
}

function summarize({ progress, deletedCount, maxRowsPerRun, startedAt, paused }: SummarizeParams): SweepSummary {
    const platformsLeft = progress.filter((entry) => entry.status === 'pending').length
    const platformsFailed = progress.filter((entry) => entry.status === 'failed').length
    return {
        deletedCount,
        platformsDone: progress.filter((entry) => entry.status === 'done').length,
        platformsFailed,
        platformsLeft,
        platformsBehind: findPlatformsBehind(progress).length,
        durationMs: Date.now() - startedAt,
        stoppedBy: resolveStopReason({ paused, platformsLeft, platformsFailed, deletedCount, maxRowsPerRun }),
    }
}

function resolveStopReason({ paused, platformsLeft, platformsFailed, deletedCount, maxRowsPerRun }: ResolveStopReasonParams): StopReason {
    if (paused) {
        return 'paused'
    }
    if (platformsLeft === 0) {
        return platformsFailed === 0 ? 'done' : 'failed'
    }
    return deletedCount >= maxRowsPerRun ? 'rowLimit' : 'timeBudget'
}

const BATCH_SIZE = 5_000
const MAX_ROWS_PER_PLATFORM_PER_ROUND = 100_000
const MAX_ROWS_PER_RUN = 1_000_000
const RUN_BUDGET_MS = 10 * 60 * 1000
const BATCH_STATEMENT_TIMEOUT_MS = 60 * 1000
const PROBE_STATEMENT_TIMEOUT_MS = 5 * 60 * 1000
const AUTOVACUUM_SCALE_FACTOR_OPTION = 'autovacuum_vacuum_scale_factor'
const AUTOVACUUM_SCALE_FACTOR = 0.02
const AUTOVACUUM_LOCK_TIMEOUT_MS = 100
const MAX_PLATFORMS_IN_BACKLOG_WARNING = 10
const EFFECTIVE_RETENTION_DAYS_SQL = 'LEAST(CASE WHEN pp."auditLogEnabled" THEN p."auditLogRetentionDays" END, $1::int)'

const PlatformIdRows = z.array(z.object({
    platformId: z.string(),
}))

const RetentionDaysRows = z.array(z.object({
    retentionDays: z.number().int().positive().nullable(),
}))

const TableOptionRows = z.array(z.object({
    reloptions: z.array(z.string()).nullable(),
}))

const LastDeletedRows = z.array(z.object({
    id: z.string(),
    created: z.string(),
    deletedCount: z.number().int(),
}))

type DeleteCursor = {
    id: string
    created: string
}

type PassOutcome = 'finished' | 'capped' | 'stopped' | 'failed'

type PlatformStatus = 'pending' | 'done' | 'failed'

type StopReason = 'done' | 'failed' | 'rowLimit' | 'timeBudget' | 'paused'

type PlatformPass = {
    deleted: number
    cursor: DeleteCursor | null
    retentionDays: number | null
    outcome: PassOutcome
    error?: Error
}

type PlatformProgress = {
    platformId: string
    deleted: number
    cursor: DeleteCursor | null
    retentionDays: number | null
    status: PlatformStatus
}

type PlatformBacklog = {
    platform: { id: string }
    retentionDays: number
    deletedUpTo: string
    daysBehind: number
}

type BatchResult = {
    deletedCount: number
    lastDeleted: DeleteCursor | null
    retentionDays: number | null
}

type SweepParams = {
    batchSize?: number
    maxRowsPerPlatformPerRound?: number
    maxRowsPerRun?: number
    runBudgetMs?: number
}

type SweepSummary = {
    deletedCount: number
    platformsDone: number
    platformsFailed: number
    platformsLeft: number
    platformsBehind: number
    durationMs: number
    stoppedBy: StopReason
}

type SummarizeParams = {
    progress: PlatformProgress[]
    deletedCount: number
    maxRowsPerRun: number
    startedAt: number
    paused: boolean
}

type ResolveStopReasonParams = {
    paused: boolean
    platformsLeft: number
    platformsFailed: number
    deletedCount: number
    maxRowsPerRun: number
}

type DeleteExpiredEventsOfPlatformParams = {
    platformId: string
    ceiling: number | null
    cursor: DeleteCursor | null
    batchSize: number
    maxRows: number
    deadline: number
}

type DeleteOneBatchParams = {
    platformId: string
    ceiling: number | null
    cursor: DeleteCursor | null
    limit: number
}
