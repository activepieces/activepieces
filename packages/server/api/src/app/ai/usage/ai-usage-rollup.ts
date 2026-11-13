import { chunk } from '@activepieces/core-utils'
import { EntityManager } from 'typeorm'
import { AiUsageBlock } from './ai-usage-block'
import { aiUsageEvent } from './ai-usage-event'

function foldBy({ events, timeKeyOf }: { events: CopiedUsageEvent[], timeKeyOf: (timestampMs: number) => string }): RollupRow[] {
    const rowsByKey = new Map<string, RollupRow>()
    for (const event of events) {
        const time = timeKeyOf(event.timestampMs)
        const seriesId = aiUsageEvent.seriesIdOf({ platformId: event.platformId, block: event.block })
        const key = `${time}|${seriesId}`
        rowsByKey.set(key, addEvent({ row: rowsByKey.get(key) ?? emptyRow({ time, seriesId, event }), event }))
    }
    return [...rowsByKey.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([, row]) => row)
}

function emptyRow({ time, seriesId, event }: { time: string, seriesId: string, event: CopiedUsageEvent }): RollupRow {
    const { block } = event
    return {
        time,
        seriesId,
        platformId: event.platformId,
        projectId: block.projectId,
        flowId: block.flowId,
        agentId: block.agentId,
        userId: block.userId,
        provider: block.provider,
        providerConfigId: block.providerConfigId,
        modelId: block.modelId,
        origin: block.origin,
        environment: block.environment,
        calls: 0,
        unpricedCalls: 0,
        runs: 0,
        inputTokens: 0,
        outputTokens: 0,
        cacheReadTokens: 0,
        cacheWriteTokens: 0,
        reasoningTokens: 0,
        reportedCostUsd: 0,
        estimatedCostUsd: 0,
        spendUsd: 0,
        managedCredits: 0,
    }
}

function addEvent({ row, event }: { row: RollupRow, event: CopiedUsageEvent }): RollupRow {
    const { block } = event
    return {
        ...row,
        calls: row.calls + 1,
        unpricedCalls: row.unpricedCalls + (block.unpriced ? 1 : 0),
        runs: row.runs + (event.firstOfRun ? 1 : 0),
        inputTokens: row.inputTokens + block.inputTokens,
        outputTokens: row.outputTokens + block.outputTokens,
        cacheReadTokens: row.cacheReadTokens + block.cacheReadTokens,
        cacheWriteTokens: row.cacheWriteTokens + block.cacheWriteTokens,
        reasoningTokens: row.reasoningTokens + block.reasoningTokens,
        reportedCostUsd: row.reportedCostUsd + block.reportedCostUsd,
        estimatedCostUsd: row.estimatedCostUsd + block.estimatedCostUsd,
        spendUsd: row.spendUsd + block.reportedCostUsd + block.estimatedCostUsd,
        managedCredits: row.managedCredits + block.managedCredits,
    }
}

function fiveMinuteKeyOf(timestampMs: number): string {
    return new Date(Math.floor(timestampMs / FIVE_MINUTES_MS) * FIVE_MINUTES_MS).toISOString()
}

function dayKeyOf(timestampMs: number): string {
    return new Date(timestampMs).toISOString().slice(0, 10)
}

async function upsertRows({ entityManager, table, rows }: { entityManager: EntityManager, table: RollupTable, rows: RollupRow[] }): Promise<void> {
    for (const rowsChunk of chunk(rows, UPSERT_CHUNK_SIZE)) {
        await entityManager.query(upsertSql(table), upsertParams(rowsChunk))
    }
}

function upsertSql(table: RollupTable): string {
    const { timeColumn, timeType } = TABLES[table]
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

function upsertParams(rows: RollupRow[]): unknown[][] {
    return [
        rows.map((row) => row.time),
        rows.map((row) => row.seriesId),
        ...DIMENSION_COLUMNS.map((column) => rows.map((row) => row[column])),
        ...COUNTER_COLUMNS.map(({ name }) => rows.map((row) => row[name])),
    ]
}

const FIVE_MINUTES_MS = 5 * 60 * 1000
const UPSERT_CHUNK_SIZE = 5_000
const DIMENSION_COLUMNS = ['platformId', 'projectId', 'flowId', 'agentId', 'userId', 'provider', 'providerConfigId', 'modelId', 'origin', 'environment'] as const
const COUNTER_COLUMNS: { name: CounterColumn, type: string }[] = [
    { name: 'calls', type: 'int' },
    { name: 'unpricedCalls', type: 'int' },
    { name: 'runs', type: 'int' },
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
const TABLES: Record<RollupTable, { timeColumn: string, timeType: string }> = {
    ai_usage_5m: { timeColumn: 'bucket', timeType: 'timestamptz' },
    ai_usage_daily: { timeColumn: 'day', timeType: 'date' },
}

export const aiUsageRollup = {
    async write({ entityManager, events }: { entityManager: EntityManager, events: CopiedUsageEvent[] }): Promise<void> {
        await upsertRows({ entityManager, table: 'ai_usage_5m', rows: foldBy({ events, timeKeyOf: fiveMinuteKeyOf }) })
        await upsertRows({ entityManager, table: 'ai_usage_daily', rows: foldBy({ events, timeKeyOf: dayKeyOf }) })
    },
}

export type CopiedUsageEvent = {
    platformId: string
    timestampMs: number
    block: AiUsageBlock
    firstOfRun: boolean
}

type RollupTable = 'ai_usage_5m' | 'ai_usage_daily'

type CounterColumn = 'calls' | 'unpricedCalls' | 'runs' | 'inputTokens' | 'outputTokens' | 'cacheReadTokens' | 'cacheWriteTokens' | 'reasoningTokens' | 'reportedCostUsd' | 'estimatedCostUsd' | 'spendUsd' | 'managedCredits'

type RollupRow = Record<typeof DIMENSION_COLUMNS[number], string | null> & Record<CounterColumn, number> & {
    time: string
    seriesId: string
}
