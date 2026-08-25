import os from 'os'
import { createLogger } from '@activepieces/server-utils'
import { isNil, tryCatch } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { QueryRunner } from 'typeorm'
import { databaseConnection } from '../database/database-connection'
import { redisConnections } from '../database/redis-connections'
import { infraSnapshotParsers } from './infra-snapshot-parsers'
import { system } from './system/system'
import { AppSystemProp } from './system/system-props'

const FAST_INTERVAL_MS = 60_000
const SLOW_INTERVAL_MS = 900_000
const STATS_STATEMENT_TIMEOUT = '5s'
const TOP_ROWS = 20
const TOP_COMMANDS = 15
const QUERY_TEXT_LENGTH = 300
const UNUSED_INDEX_MIN_BYTES = 10 * 1024 * 1024

function start({ log }: { log: FastifyBaseLogger }): void {
    if (!system.getBoolean(AppSystemProp.INFRA_METRICS_ENABLED)) {
        return
    }
    schedule({ intervalMs: FAST_INTERVAL_MS, tick: () => fastTick(), log })
    schedule({ intervalMs: SLOW_INTERVAL_MS, tick: () => slowTick(), log })
}

function schedule({ intervalMs, tick, log }: ScheduleParams): void {
    setInterval(() => {
        tick().catch((error) => log.debug({ error }, '[infra-snapshot] tick failed'))
    }, intervalMs).unref()
}

async function fastTick(): Promise<void> {
    const claimed = await claimTick({ key: 'infra-metrics:fast', intervalMs: FAST_INTERVAL_MS })
    if (!claimed) {
        return
    }
    const database = await collectDatabaseSnapshot()
    if (!isNil(database)) {
        emit({ event: 'db.snapshot', ...database })
    }
    const redis = await collectRedisSnapshot()
    if (!isNil(redis)) {
        emit({ event: 'redis.snapshot', ...redis })
    }
}

async function slowTick(): Promise<void> {
    const claimed = await claimTick({ key: 'infra-metrics:slow', intervalMs: SLOW_INTERVAL_MS })
    if (!claimed) {
        return
    }
    const catalog = await collectCatalogSnapshot()
    for (const fields of catalog) {
        emit(fields)
    }
    const commands = await collectRedisCommands()
    for (const fields of commands) {
        emit(fields)
    }
}

async function claimTick({ key, intervalMs }: ClaimTickParams): Promise<boolean> {
    const bucket = Math.floor(Date.now() / intervalMs)
    const ttlSeconds = Math.ceil(intervalMs / 1000) * 2
    const { data } = await tryCatch(async () => {
        const client = await redisConnections.useExisting()
        return client.set(`${key}:${bucket}`, os.hostname(), 'EX', ttlSeconds, 'NX')
    })
    return data === 'OK'
}

async function collectDatabaseSnapshot(): Promise<Record<string, number> | null> {
    return withStatsConnection(async (runner) => {
        const [database] = infraSnapshotParsers.asRows(await runner.query(DATABASE_STATS_SQL))
        const [activity] = infraSnapshotParsers.asRows(await runner.query(ACTIVITY_STATS_SQL))
        return {
            ...infraSnapshotParsers.numericFields(database ?? {}),
            ...infraSnapshotParsers.numericFields(activity ?? {}),
        }
    })
}

async function collectCatalogSnapshot(): Promise<Record<string, unknown>[]> {
    const catalog = await withStatsConnection(async (runner) => {
        const tables = infraSnapshotParsers.asRows(await runner.query(TABLE_STATS_SQL, [TOP_ROWS]))
            .map((row) => ({ event: 'db.table', table: infraSnapshotParsers.toText(row['table']), ...infraSnapshotParsers.numericFields(row) }))
        const indexes = infraSnapshotParsers.asRows(await runner.query(INDEX_STATS_SQL, [UNUSED_INDEX_MIN_BYTES, TOP_ROWS]))
            .map((row) => ({ event: 'db.index', table: infraSnapshotParsers.toText(row['table']), index: infraSnapshotParsers.toText(row['index']), ...infraSnapshotParsers.numericFields(row) }))
        return [...tables, ...indexes]
    })
    const statements = await withStatsConnection((runner) => collectStatements(runner))
    return [...(catalog ?? []), ...(statements ?? [])]
}

async function collectStatements(runner: QueryRunner): Promise<Record<string, unknown>[]> {
    const available = infraSnapshotParsers.asRows(await runner.query(STATEMENTS_AVAILABLE_SQL)).length > 0
    if (!available) {
        return [{ event: 'db.statement', available: false }]
    }
    return infraSnapshotParsers.asRows(await runner.query(STATEMENT_STATS_SQL, [QUERY_TEXT_LENGTH, TOP_ROWS]))
        .map((row) => ({
            event: 'db.statement',
            available: true,
            queryId: infraSnapshotParsers.toText(row['query_id']),
            query: infraSnapshotParsers.toText(row['query']),
            ...infraSnapshotParsers.numericFields(row),
        }))
}

async function collectRedisSnapshot(): Promise<Record<string, unknown> | null> {
    const { data, error } = await tryCatch(async () => {
        const client = await redisConnections.useExisting()
        return client.info()
    })
    if (!isNil(error) || isNil(data)) {
        return null
    }
    const info = infraSnapshotParsers.parseInfoSections(data)
    const keyspace = infraSnapshotParsers.sumKeyspace(info)
    return {
        ...infraSnapshotParsers.pickNumbers({ info, keys: REDIS_SNAPSHOT_FIELDS }),
        rdbLastBgsaveStatus: info['rdb_last_bgsave_status'] ?? null,
        aofLastWriteStatus: info['aof_last_write_status'] ?? null,
        keys: keyspace.keys,
        keysWithoutTtl: keyspace.keysWithoutTtl,
    }
}

async function collectRedisCommands(): Promise<Record<string, unknown>[]> {
    const { data, error } = await tryCatch(async () => {
        const client = await redisConnections.useExisting()
        const [commandStats, latencyStats] = await Promise.all([
            client.info('commandstats'),
            tryCatch(() => client.info('latencystats')),
        ])
        return { commandStats, latencyStats: latencyStats.data ?? '' }
    })
    if (!isNil(error) || isNil(data)) {
        return []
    }
    const commandStats = infraSnapshotParsers.parseInfoSections(data.commandStats)
    const latencyStats = infraSnapshotParsers.parseInfoSections(data.latencyStats)
    return Object.entries(commandStats)
        .filter(([key]) => key.startsWith('cmdstat_'))
        .map(([key, value]) => {
            const command = key.slice('cmdstat_'.length)
            const stats = infraSnapshotParsers.parseFieldList(value)
            const latency = infraSnapshotParsers.parseFieldList(latencyStats[`latency_percentiles_usec_${command}`] ?? '')
            return {
                event: 'redis.command',
                command,
                calls: infraSnapshotParsers.toNumber(stats['calls']) ?? 0,
                usec: infraSnapshotParsers.toNumber(stats['usec']) ?? 0,
                usecPerCall: infraSnapshotParsers.toNumber(stats['usec_per_call']) ?? 0,
                rejectedCalls: infraSnapshotParsers.toNumber(stats['rejected_calls']) ?? 0,
                failedCalls: infraSnapshotParsers.toNumber(stats['failed_calls']) ?? 0,
                p50Usec: infraSnapshotParsers.toNumber(latency['p50']),
                p99Usec: infraSnapshotParsers.toNumber(latency['p99']),
                p999Usec: infraSnapshotParsers.toNumber(latency['p99.9']),
            }
        })
        .sort((a, b) => b.calls - a.calls)
        .slice(0, TOP_COMMANDS)
}

async function withStatsConnection<T>(read: (runner: QueryRunner) => Promise<T>): Promise<T | null> {
    const runner = databaseConnection().createQueryRunner()
    const { data, error } = await tryCatch(async () => {
        await runner.connect()
        await runner.startTransaction()
        await runner.query('SELECT set_config($1, $2, true)', ['statement_timeout', STATS_STATEMENT_TIMEOUT])
        const result = await read(runner)
        await runner.commitTransaction()
        return result
    })
    if (!isNil(error) && runner.isTransactionActive) {
        await tryCatch(() => runner.rollbackTransaction())
    }
    await tryCatch(() => runner.release())
    return isNil(error) ? data : null
}

function emit(fields: Record<string, unknown>): void {
    createLogger({ host: os.hostname(), ...fields }).emit({ _forceKeep: true })
}

const DATABASE_STATS_SQL = `
    SELECT
        d.numbackends AS num_backends,
        d.xact_commit,
        d.xact_rollback,
        d.blks_read,
        d.blks_hit,
        d.tup_returned,
        d.tup_fetched,
        d.tup_inserted,
        d.tup_updated,
        d.tup_deleted,
        d.conflicts,
        d.deadlocks,
        d.temp_files,
        d.temp_bytes,
        pg_database_size(d.datname) AS database_size_bytes,
        (SELECT setting::int FROM pg_settings WHERE name = 'max_connections') AS max_connections
    FROM pg_stat_database d
    WHERE d.datname = current_database()
`

const ACTIVITY_STATS_SQL = `
    SELECT
        count(*) FILTER (WHERE state = 'active') AS active_count,
        count(*) FILTER (WHERE state = 'idle') AS idle_count,
        count(*) FILTER (WHERE state = 'idle in transaction') AS idle_in_transaction_count,
        count(*) FILTER (WHERE state = 'active' AND wait_event_type IS NOT NULL) AS waiting_count,
        coalesce(max(extract(epoch FROM now() - query_start)) FILTER (WHERE state = 'active'), 0) AS longest_query_seconds,
        coalesce(max(extract(epoch FROM now() - state_change)) FILTER (WHERE state = 'idle in transaction'), 0) AS longest_idle_in_transaction_seconds,
        (SELECT count(*) FROM pg_locks WHERE NOT granted) AS ungranted_lock_count
    FROM pg_stat_activity
    WHERE datname = current_database()
`

const TABLE_STATS_SQL = `
    SELECT
        t.relname AS "table",
        t.seq_scan,
        t.seq_tup_read,
        t.idx_scan,
        t.n_live_tup,
        t.n_dead_tup,
        extract(epoch FROM now() - greatest(t.last_autovacuum, t.last_vacuum)) AS vacuum_age_seconds,
        io.heap_blks_read,
        io.heap_blks_hit,
        pg_total_relation_size(t.relid) AS total_size_bytes,
        pg_indexes_size(t.relid) AS index_size_bytes
    FROM pg_stat_user_tables t
    LEFT JOIN pg_statio_user_tables io ON io.relid = t.relid
    ORDER BY t.seq_tup_read DESC
    LIMIT $1
`

const INDEX_STATS_SQL = `
    SELECT
        s.relname AS "table",
        s.indexrelname AS "index",
        s.idx_scan,
        pg_relation_size(s.indexrelid) AS size_bytes
    FROM pg_stat_user_indexes s
    JOIN pg_index i ON i.indexrelid = s.indexrelid
    WHERE s.idx_scan = 0
        AND NOT i.indisunique
        AND NOT i.indisprimary
        AND pg_relation_size(s.indexrelid) >= $1
    ORDER BY pg_relation_size(s.indexrelid) DESC
    LIMIT $2
`

const STATEMENTS_AVAILABLE_SQL = 'SELECT 1 FROM pg_extension WHERE extname = \'pg_stat_statements\''

const STATEMENT_STATS_SQL = `
    SELECT
        s.queryid::text AS query_id,
        s.calls,
        s.rows,
        s.total_exec_time AS total_exec_ms,
        s.mean_exec_time AS mean_exec_ms,
        s.shared_blks_read,
        s.shared_blks_hit,
        left(s.query, $1) AS query
    FROM pg_stat_statements s
    JOIN pg_database d ON d.oid = s.dbid
    WHERE d.datname = current_database()
    ORDER BY s.total_exec_time DESC
    LIMIT $2
`

const REDIS_SNAPSHOT_FIELDS = [
    'used_memory',
    'used_memory_rss',
    'used_memory_peak',
    'maxmemory',
    'mem_fragmentation_ratio',
    'connected_clients',
    'blocked_clients',
    'rejected_connections',
    'evicted_keys',
    'expired_keys',
    'keyspace_hits',
    'keyspace_misses',
    'instantaneous_ops_per_sec',
    'total_commands_processed',
    'total_net_input_bytes',
    'total_net_output_bytes',
    'latest_fork_usec',
    'uptime_in_seconds',
]

export const infraSnapshot = {
    start,
}

type ScheduleParams = {
    intervalMs: number
    tick: () => Promise<void>
    log: FastifyBaseLogger
}

type ClaimTickParams = {
    key: string
    intervalMs: number
}
