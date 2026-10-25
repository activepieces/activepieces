import { isNil, tryCatch, tryCatchSync } from '@activepieces/core-utils'
import { onCallService, wideEvent } from '@activepieces/server-utils'
import { FastifyBaseLogger } from 'fastify'
import { EntityManager } from 'typeorm'
import { transaction } from '../../core/db/transaction'
import { databaseConnection } from '../../database/database-connection'
import { distributedStore, redisConnections } from '../../database/redis-connections'
import { system } from '../../helper/system/system'
import { AppSystemProp } from '../../helper/system/system-props'
import { AiUsageEvent } from './ai-usage-event'
import { AI_USAGE_STREAM_KEY } from './ai-usage-ingest'
import { streamId, StreamId } from './stream-id'

async function flushUntilDeadline(log: FastifyBaseLogger): Promise<void> {
    const startedAt = Date.now()
    await ensureCursor()
    const cursorAtStart = await readCursor()
    const leftoversDeleted = await deleteFlushedLeftovers(cursorAtStart)
    await guardAgainstRegressedStream({ cursor: cursorAtStart, log })
    const summary: FlushSummary = { entriesRead: 0, invalidEntries: 0, rowsWritten: 0, casLost: false, leftoversDeleted, batches: 0 }
    const finished = await flushBatches({ cursor: cursorAtStart, startedAt, summary })
    const redis = await redisConnections.useExisting()
    const streamLength = await redis.xlen(AI_USAGE_STREAM_KEY)
    const oldest = await redis.xrange(AI_USAGE_STREAM_KEY, '-', '+', 'COUNT', 1)
    wideEvent.set({
        aiUsageFlush: {
            ...finished,
            streamLength,
            oldestEntryAgeMs: oldest.length === 0 ? 0 : Date.now() - streamId.parse(oldest[0][0]).ms,
            durationMs: Date.now() - startedAt,
        },
    })
}

async function flushBatches({ cursor, startedAt, summary }: { cursor: StreamId, startedAt: number, summary: FlushSummary }): Promise<FlushSummary> {
    if (Date.now() - startedAt > RUN_BUDGET_MS) {
        return summary
    }
    const entries = await readBatch(cursor)
    if (entries.length === 0) {
        return summary
    }
    const lastId = streamId.parse(entries[entries.length - 1].id)
    const folded = foldEntries(entries)
    const outcome = await writeBatch({ from: cursor, to: lastId, folded })
    const next: FlushSummary = {
        ...summary,
        entriesRead: summary.entriesRead + entries.length,
        invalidEntries: summary.invalidEntries + folded.invalidEntries,
        rowsWritten: summary.rowsWritten + outcome.rowsWritten,
        casLost: outcome.casLost,
        batches: summary.batches + 1,
    }
    if (outcome.casLost) {
        return next
    }
    await deleteFromStream(entries.map((entry) => entry.id))
    return flushBatches({ cursor: lastId, startedAt, summary: next })
}

async function readBatch(cursor: StreamId): Promise<StreamEntry[]> {
    const redis = await redisConnections.useExisting()
    return readPages({ redis, start: streamId.increment(cursor), collected: [] })
}

async function readPages({ redis, start, collected }: ReadPagesParams): Promise<StreamEntry[]> {
    const page = await redis.xrange(AI_USAGE_STREAM_KEY, streamId.format(start), '+', 'COUNT', READ_PAGE_SIZE)
    const entries = [...collected, ...page.map(([id, fields]) => ({ id, fields }))]
    if (page.length < READ_PAGE_SIZE || entries.length >= MAX_ENTRIES_PER_TRANSACTION) {
        return entries
    }
    return readPages({ redis, start: streamId.increment(streamId.parse(page[page.length - 1][0])), collected: entries })
}

function foldEntries(entries: StreamEntry[]): FoldedBatch {
    return entries.reduce<FoldedBatch>((folded, entry) => {
        const parsed = parseEntry(entry)
        if (isNil(parsed)) {
            return { ...folded, invalidEntries: folded.invalidEntries + 1 }
        }
        const ms = streamId.parse(entry.id).ms
        addTo({ rows: folded.fiveMinute, key: new Date(Math.floor(ms / FIVE_MINUTES_MS) * FIVE_MINUTES_MS).toISOString(), parsed })
        addTo({ rows: folded.daily, key: new Date(ms).toISOString().slice(0, 10), parsed })
        return folded
    }, { fiveMinute: new Map(), daily: new Map(), invalidEntries: 0 })
}

function parseEntry(entry: StreamEntry): ParsedEntry | null {
    const fields = Object.fromEntries(chunkPairs(entry.fields))
    const { data } = tryCatchSync(() => JSON.parse(fields['e'] ?? ''))
    const event = AiUsageEvent.safeParse(data)
    if (!event.success) {
        return null
    }
    return { event: event.data, firstOfRun: fields['r'] === '1' ? 1 : 0 }
}

function addTo({ rows, key, parsed }: { rows: Map<string, UsageRow>, key: string, parsed: ParsedEntry }): void {
    const { event, firstOfRun } = parsed
    const mapKey = `${key}|${event.seriesId}`
    const existing = rows.get(mapKey)
    if (isNil(existing)) {
        rows.set(mapKey, { time: key, event: { ...event }, calls: 1, runs: firstOfRun })
        return
    }
    rows.set(mapKey, {
        time: key,
        calls: existing.calls + 1,
        runs: existing.runs + firstOfRun,
        event: {
            ...existing.event,
            ...Object.fromEntries(SUMMED_FIELDS.map((field) => [field, existing.event[field] + event[field]])),
        },
    })
}

async function writeBatch({ from, to, folded }: { from: StreamId, to: StreamId, folded: FoldedBatch }): Promise<WriteOutcome> {
    const { error, data } = await tryCatch(() => transaction(async (entityManager) => {
        const moved = await entityManager.query(CURSOR_CAS_SQL, [streamId.format(to), streamId.format(from)])
        if (Number(moved[0]?.updated ?? 0) !== 1) {
            throw new CursorMovedError()
        }
        const fiveMinuteRows = await upsertRows({ entityManager, table: 'ai_usage_5m', timeColumn: 'bucket', timeType: 'timestamptz', rows: folded.fiveMinute })
        const dailyRows = await upsertRows({ entityManager, table: 'ai_usage_daily', timeColumn: 'day', timeType: 'date', rows: folded.daily })
        return fiveMinuteRows + dailyRows
    }))
    if (error instanceof CursorMovedError) {
        return { rowsWritten: 0, casLost: true }
    }
    if (!isNil(error)) {
        throw error
    }
    return { rowsWritten: data ?? 0, casLost: false }
}

async function upsertRows({ entityManager, table, timeColumn, timeType, rows }: UpsertRowsParams): Promise<number> {
    const sorted = [...rows.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([, row]) => row)
    const chunks = Array.from({ length: Math.ceil(sorted.length / UPSERT_CHUNK_SIZE) }, (_, index) => sorted.slice(index * UPSERT_CHUNK_SIZE, (index + 1) * UPSERT_CHUNK_SIZE))
    for (const chunk of chunks) {
        await entityManager.query(upsertSql({ table, timeColumn, timeType }), upsertParams(chunk))
    }
    return sorted.length
}

function upsertSql({ table, timeColumn, timeType }: Omit<UpsertRowsParams, 'entityManager' | 'rows'>): string {
    const columns = [timeColumn, 'seriesId', ...DIMENSION_COLUMNS, ...COUNTER_COLUMNS.map((column) => column.name)]
    const types = [timeType, 'varchar', ...DIMENSION_COLUMNS.map(() => 'varchar'), ...COUNTER_COLUMNS.map((column) => column.type)]
    const quoted = columns.map((column) => `"${column}"`).join(', ')
    const unnested = types.map((type, index) => `$${index + 1}::${type}[]`).join(', ')
    const increments = COUNTER_COLUMNS.map(({ name }) => `"${name}" = "${table}"."${name}" + EXCLUDED."${name}"`).join(', ')
    return `INSERT INTO "${table}" (${quoted})
        SELECT ${quoted} FROM unnest(${unnested}) AS u(${quoted})
        WHERE EXISTS (SELECT 1 FROM "platform" p WHERE p."id" = u."platformId")
        ON CONFLICT ("${timeColumn}", "seriesId") DO UPDATE SET ${increments}`
}

function upsertParams(rows: UsageRow[]): unknown[][] {
    return [
        rows.map((row) => row.time),
        rows.map((row) => row.event.seriesId),
        ...DIMENSION_COLUMNS.map((column) => rows.map((row) => row.event[column])),
        ...COUNTER_COLUMNS.map(({ name }) => rows.map((row) => counterOf({ row, name }))),
    ]
}

function counterOf({ row, name }: { row: UsageRow, name: CounterColumn }): number {
    switch (name) {
        case 'calls':
            return row.calls
        case 'runs':
            return row.runs
        default:
            return row.event[name]
    }
}

async function ensureCursor(): Promise<void> {
    await databaseConnection().query('INSERT INTO "ai_usage_ingest_cursor" ("shard", "lastId") VALUES (0, \'0-0\') ON CONFLICT DO NOTHING')
}

async function readCursor(): Promise<StreamId> {
    const rows: { lastId: string }[] = await databaseConnection().query('SELECT "lastId" FROM "ai_usage_ingest_cursor" WHERE "shard" = 0')
    return streamId.parse(rows[0]?.lastId ?? '0-0')
}

async function deleteFlushedLeftovers(cursor: StreamId): Promise<number> {
    if (cursor.ms === 0 && cursor.seq === 0n) {
        return 0
    }
    const redis = await redisConnections.useExisting()
    const leftovers = await redis.xrange(AI_USAGE_STREAM_KEY, '-', streamId.format(cursor), 'COUNT', READ_PAGE_SIZE)
    await deleteFromStream(leftovers.map(([id]) => id))
    return leftovers.length
}

async function guardAgainstRegressedStream({ cursor, log }: { cursor: StreamId, log: FastifyBaseLogger }): Promise<void> {
    const redis = await redisConnections.useExisting()
    const { data: info, error } = await tryCatch(() => redis.xinfo('STREAM', AI_USAGE_STREAM_KEY))
    if (!isNil(error) || !Array.isArray(info)) {
        return
    }
    const index = info.indexOf('last-generated-id')
    const lastGenerated = index === -1 ? undefined : info[index + 1]
    if (typeof lastGenerated !== 'string' || streamId.compare(streamId.parse(lastGenerated), cursor) >= 0) {
        return
    }
    await redis.call('XSETID', AI_USAGE_STREAM_KEY, streamId.format(cursor))
    await page({ log, code: 'AI_USAGE_CURSOR_REGRESSED', message: 'The AI usage stream restarted below the saved cursor (likely a Redis failover). The stream id was moved forward so new calls are not skipped; calls in the gap may be lost.', params: { cursor: streamId.format(cursor), lastGenerated } })
}

async function deleteFromStream(ids: string[]): Promise<void> {
    if (ids.length === 0) {
        return
    }
    const redis = await redisConnections.useExisting()
    const chunks = Array.from({ length: Math.ceil(ids.length / READ_PAGE_SIZE) }, (_, index) => ids.slice(index * READ_PAGE_SIZE, (index + 1) * READ_PAGE_SIZE))
    for (const chunk of chunks) {
        await tryCatch(() => redis.xdel(AI_USAGE_STREAM_KEY, ...chunk))
    }
}

async function page({ log, code, message, params }: PageParams): Promise<void> {
    await distributedStore.runOnceWithin(`ai-usage:page:${code}`, PAGE_EVERY_SECONDS, () =>
        onCallService(log, system.get(AppSystemProp.PAGE_ONCALL_WEBHOOK)).page({ code, message, params }),
    )
}

function chunkPairs(fields: string[]): [string, string][] {
    return Array.from({ length: Math.floor(fields.length / 2) }, (_, index) => [fields[index * 2], fields[index * 2 + 1]])
}

class CursorMovedError extends Error {}

const FIVE_MINUTES_MS = 5 * 60 * 1000
const RUN_BUDGET_MS = 40_000
const READ_PAGE_SIZE = 5_000
const MAX_ENTRIES_PER_TRANSACTION = 100_000
const UPSERT_CHUNK_SIZE = 5_000
const FAILURE_COUNT_KEY = 'ai-usage:flush:consecutive-failures'
const FAILURE_COUNT_TTL_SECONDS = 60 * 60
const FAILURES_BEFORE_PAGE = 5
const PAGE_EVERY_SECONDS = 30 * 60
const DIMENSION_COLUMNS = ['platformId', 'projectId', 'flowId', 'agentId', 'userId', 'provider', 'providerConfigId', 'modelId', 'origin', 'environment'] as const
const SUMMED_FIELDS = ['unpricedCalls', 'inputTokens', 'outputTokens', 'cacheReadTokens', 'cacheWriteTokens', 'reasoningTokens', 'reportedCostUsd', 'estimatedCostUsd', 'spendUsd', 'managedCredits'] as const
const COUNTER_COLUMNS: { name: CounterColumn, type: string }[] = [
    { name: 'calls', type: 'integer' },
    { name: 'unpricedCalls', type: 'integer' },
    { name: 'runs', type: 'integer' },
    { name: 'inputTokens', type: 'bigint' },
    { name: 'outputTokens', type: 'bigint' },
    { name: 'cacheReadTokens', type: 'bigint' },
    { name: 'cacheWriteTokens', type: 'bigint' },
    { name: 'reasoningTokens', type: 'bigint' },
    { name: 'reportedCostUsd', type: 'float8' },
    { name: 'estimatedCostUsd', type: 'float8' },
    { name: 'spendUsd', type: 'float8' },
    { name: 'managedCredits', type: 'float8' },
]
const CURSOR_CAS_SQL = `WITH moved AS (
    UPDATE "ai_usage_ingest_cursor" SET "lastId" = $1, "lastFlushedAt" = now() WHERE "shard" = 0 AND "lastId" = $2 RETURNING 1
) SELECT count(*)::int AS "updated" FROM moved`

export const aiUsageFlush = (log: FastifyBaseLogger) => ({
    async run(): Promise<void> {
        const { error } = await tryCatch(() => flushUntilDeadline(log))
        const redis = await redisConnections.useExisting()
        if (isNil(error)) {
            await redis.del(FAILURE_COUNT_KEY)
            return
        }
        const failures = await redis.incr(FAILURE_COUNT_KEY)
        await redis.expire(FAILURE_COUNT_KEY, FAILURE_COUNT_TTL_SECONDS)
        if (failures >= FAILURES_BEFORE_PAGE) {
            await page({ log, code: 'AI_USAGE_FLUSH_FAILING', message: `AI_USAGE_FLUSH failed ${failures} times in a row, so AI usage is not reaching Postgres.`, params: { failures } })
        }
        throw error
    },
})

type CounterColumn = 'calls' | 'runs' | typeof SUMMED_FIELDS[number]

type StreamEntry = {
    id: string
    fields: string[]
}

type ParsedEntry = {
    event: AiUsageEvent
    firstOfRun: number
}

type UsageRow = {
    time: string
    event: AiUsageEvent
    calls: number
    runs: number
}

type FoldedBatch = {
    fiveMinute: Map<string, UsageRow>
    daily: Map<string, UsageRow>
    invalidEntries: number
}

type FlushSummary = {
    entriesRead: number
    invalidEntries: number
    rowsWritten: number
    casLost: boolean
    leftoversDeleted: number
    batches: number
}

type WriteOutcome = {
    rowsWritten: number
    casLost: boolean
}

type ReadPagesParams = {
    redis: Awaited<ReturnType<typeof redisConnections.useExisting>>
    start: StreamId
    collected: StreamEntry[]
}

type UpsertRowsParams = {
    entityManager: EntityManager
    table: 'ai_usage_5m' | 'ai_usage_daily'
    timeColumn: 'bucket' | 'day'
    timeType: 'timestamptz' | 'date'
    rows: Map<string, UsageRow>
}

type PageParams = {
    log: FastifyBaseLogger
    code: string
    message: string
    params: Record<string, unknown>
}
