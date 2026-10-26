import { AIProviderName, AiUsageEnvironment, AiUsageOrigin, isNil, tryCatch } from '@activepieces/core-utils'
import { modelCatalog } from '@activepieces/server-utils'
import { AI_USAGE_RELATED_DIMENSIONS, AI_USAGE_SOURCE_DIMENSIONS, AIProviderModelMetadata, AiUsageDetail, AiUsageDimension, AiUsageHistory, AiUsageItem, AiUsageItemList, AiUsageOverview, AiUsagePeriod, AiUsageScope, AiUsageSeriesPoint, AiUsageSource, AiUsageSourceSpend, AiUsageTotals } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { lru } from 'tiny-lru'
import { transaction } from '../../core/db/transaction'
import { databaseConnection } from '../../database/database-connection'
import { distributedStore } from '../../database/redis-connections'
import { platformService } from '../../platform/platform.service'
import { aiUsageDimension, DimensionCondition, DimensionKeys } from './ai-usage-dimension'
import { aiUsageNames, NameBook } from './ai-usage-names'
import { aiUsagePeriod, ResolvedPeriod } from './ai-usage-period'

function maskOf({ set, columns }: { set: SetName, columns: GroupColumn[] }): number {
    return columns.reduce((mask, column, index) => SETS[set].includes(column) ? mask : mask | (1 << (columns.length - 1 - index)), 0)
}

function groupColumnsOf(sets: SetName[]): GroupColumn[] {
    return GROUP_COLUMNS.filter((column) => sets.some((set) => SETS[set].includes(column)))
}

function buildQuery({ platformId, resolved, scope, conditions, sets, rankedSets, alwaysSets, topN }: QueryParams): BuiltQuery {
    const values: unknown[] = []
    const param = (value: unknown, cast: string): string => {
        values.push(value)
        return `$${values.length}::${cast}`
    }
    const daily = resolved.table === 'ai_usage_daily'
    const time = daily ? '"day"' : '"bucket"'
    const timeCast = daily ? 'date' : 'timestamptz'
    const timeValue = (date: Date): string => daily ? aiUsagePeriod.dayOf(date) : date.toISOString()
    const platform = param(platformId, 'varchar')
    const previousStart = param(timeValue(resolved.previous.start), timeCast)
    const previousEnd = param(timeValue(resolved.previous.end), timeCast)
    const currentStart = param(timeValue(resolved.current.start), timeCast)
    const currentEnd = param(timeValue(resolved.current.end), timeCast)
    const rangeStart = `CASE WHEN ${time} >= ${currentStart} THEN ${currentStart} ELSE ${previousStart} END`
    const rawSlot = daily ? `(${time} - ${rangeStart})` : `floor(extract(epoch FROM ${time} - ${rangeStart}) / ${param(resolved.stepMs / 1000, 'float8')})::int`
    const slot = `least(${rawSlot}, ${param(resolved.slotCount - 1, 'int')})`
    const weight = !daily || isNil(resolved.scale)
        ? '1'
        : `CASE WHEN ${time} < ${currentStart} AND ${time} = ${param(aiUsagePeriod.dayOf(resolved.scale.day), 'date')} THEN ${param(resolved.scale.fraction, 'float8')} ELSE 1 END`
    const environment = SCOPE_ENVIRONMENT[scope]
    const scopeFilter = isNil(environment) ? '' : `AND "environment" = ${param(environment, 'varchar')}`
    const dimensionFilter = conditions.map(({ column, value }) => isNil(value) ? `AND "${column}" IS NULL` : `AND "${column}" = ${param(value, 'varchar')}`).join(' ')
    const columns = groupColumnsOf(sets)
    const quoted = columns.map((column) => `"${column}"`)
    const maskFor = (set: SetName): number => maskOf({ set, columns })
    const requiredKeyDrops = sets.flatMap((set) => {
        const required = REQUIRED_KEY[set]
        return isNil(required) ? [] : [`NOT (g = ${maskFor(set)} AND "${required}" IS NULL)`]
    })
    const projectCounts = sets.includes('project')
        ? `, count(*) FILTER (WHERE g = ${maskFor('flow')} AND "calls" > 0) OVER (PARTITION BY "projectId")::int AS "flowCount",
           count(*) FILTER (WHERE g = ${maskFor('projectAgent')} AND "calls" > 0) OVER (PARTITION BY "projectId")::int AS "agentCount"`
        : ''
    const groupingSets = sets.map((set) => `(${SETS[set].map((column) => `"${column}"`).join(', ')})`).join(', ')
    const tieBreak = quoted.filter((column) => column !== '"slot"' && column !== '"origin"')
    const sql = `
        WITH base AS (
            SELECT "projectId", "flowId", "agentId", "userId", "provider", "providerConfigId", "modelId", "origin",
                "spendUsd", "calls", "inputTokens", "outputTokens", "cacheReadTokens", "managedCredits", "runs", "reportedCostUsd", "estimatedCostUsd",
                ${time} >= ${currentStart} AS cur,
                ${weight} AS w,
                ${slot} AS "slot"
            FROM "${resolved.table}"
            WHERE "platformId" = ${platform}
                AND ((${time} >= ${previousStart} AND ${time} < ${previousEnd}) OR (${time} >= ${currentStart} AND ${time} < ${currentEnd}))
                ${scopeFilter}
                ${dimensionFilter}
        ), agg AS (
            SELECT GROUPING(${quoted.join(', ')})::int AS g, ${quoted.join(', ')},
                coalesce(sum("spendUsd") FILTER (WHERE cur), 0)::float8 AS "spend",
                coalesce(sum("spendUsd" * w) FILTER (WHERE NOT cur), 0)::float8 AS "previousSpend",
                coalesce(sum("calls") FILTER (WHERE cur), 0)::float8 AS "calls",
                coalesce(sum("calls" * w) FILTER (WHERE NOT cur), 0)::float8 AS "previousCalls",
                coalesce(sum("inputTokens" + "outputTokens") FILTER (WHERE cur), 0)::float8 AS "tokens",
                coalesce(sum(("inputTokens" + "outputTokens") * w) FILTER (WHERE NOT cur), 0)::float8 AS "previousTokens",
                coalesce(sum("inputTokens") FILTER (WHERE cur), 0)::float8 AS "inputTokens",
                coalesce(sum("cacheReadTokens") FILTER (WHERE cur), 0)::float8 AS "cacheReadTokens",
                coalesce(sum("managedCredits") FILTER (WHERE cur), 0)::float8 AS "managedCredits",
                coalesce(sum("runs") FILTER (WHERE cur), 0)::float8 AS "runs",
                coalesce(sum("reportedCostUsd") FILTER (WHERE cur), 0)::float8 AS "reportedUsd",
                coalesce(sum("estimatedCostUsd") FILTER (WHERE cur), 0)::float8 AS "estimatedUsd",
                coalesce(sum("spendUsd") FILTER (WHERE cur AND "origin" = '${AiUsageOrigin.FLOW_AGENT_STEP}' AND "flowId" IS NOT NULL AND "agentId" IS NOT NULL), 0)::float8 AS "sharedUsd"
            FROM base
            GROUP BY GROUPING SETS (${groupingSets})
        ), ranked AS (
            SELECT agg.*,
                row_number() OVER (PARTITION BY g ORDER BY "spend" DESC, "calls" DESC${tieBreak.length > 0 ? `, ${tieBreak.join(', ')}` : ''})::int AS "rank",
                count(*) FILTER (WHERE "calls" > 0) OVER (PARTITION BY g)::int AS "setCount",
                sum("spend") OVER (PARTITION BY g)::float8 AS "setSpend"
                ${projectCounts}
            FROM agg
            ${requiredKeyDrops.length > 0 ? `WHERE ${requiredKeyDrops.join(' AND ')}` : ''}
        )
        SELECT ranked.*, (SELECT EXISTS (SELECT 1 FROM "ai_usage_daily" WHERE "platformId" = ${platform})) AS "hasAnyUsage"
        FROM ranked
        WHERE g = ANY(${param(alwaysSets.map(maskFor), 'int[]')})
            OR (g = ANY(${param(rankedSets.map(maskFor), 'int[]')}) AND "rank" <= ${param(topN, 'int')} AND "calls" > 0)
        ORDER BY g, "rank"`
    return { sql, values, maskFor }
}

async function queryRows(query: BuiltQuery): Promise<UsageRow[]> {
    return transaction(async (entityManager) => {
        await entityManager.query(`SET LOCAL statement_timeout = ${STATEMENT_TIMEOUT_MS}`)
        const rows: UsageRow[] = await entityManager.query(query.sql, query.values)
        return rows
    })
}

async function trackingStart(): Promise<number | null> {
    const cached = trackingStartCache.get(TRACKING_START_KEY)
    if (!isNil(cached)) {
        return cached
    }
    const rows: { firstDay: string | null, firstBucketMs: number | null }[] = await databaseConnection().query(
        `SELECT (SELECT min("day") FROM "ai_usage_daily")::text AS "firstDay",
            (SELECT extract(epoch FROM min("bucket")) * 1000 FROM "ai_usage_5m")::float8 AS "firstBucketMs"`,
    )
    const { firstDay, firstBucketMs } = rows[0] ?? { firstDay: null, firstBucketMs: null }
    if (isNil(firstDay)) {
        return null
    }
    const sameDay = !isNil(firstBucketMs) && aiUsagePeriod.dayOf(new Date(firstBucketMs)) === firstDay
    const start = sameDay ? firstBucketMs : Date.parse(`${firstDay}T00:00:00.000Z`)
    trackingStartCache.set(TRACKING_START_KEY, start)
    return start
}

function historyOf({ resolved, since, hasAnyUsage, now }: { resolved: ResolvedPeriod, since: number | null, hasAnyUsage: boolean, now: number }): AiUsageHistory {
    const start = resolved.current.start.getTime()
    const end = Math.min(resolved.current.end.getTime(), now)
    const periodDays = Math.max(1, Math.round((resolved.current.end.getTime() - start) / aiUsagePeriod.DAY_MS))
    if (isNil(since)) {
        return { trackingSince: null, hasAnyUsage, coveredDays: periodDays, periodDays, currentCoverage: 1, comparable: false }
    }
    const coveredMs = Math.max(0, end - Math.max(start, since))
    const coveredDays = Math.min(periodDays, Math.ceil((resolved.current.end.getTime() - Math.max(start, since)) / aiUsagePeriod.DAY_MS))
    return {
        trackingSince: new Date(since).toISOString(),
        hasAnyUsage,
        coveredDays: Math.max(0, coveredDays),
        periodDays,
        currentCoverage: end > start ? Math.min(1, coveredMs / (end - start)) : 1,
        comparable: since <= resolved.previous.start.getTime(),
    }
}

function totalsOf(row: UsageRow | undefined): AiUsageTotals {
    const totals = row ?? EMPTY_ROW
    return {
        spendUsd: totals.spend,
        previousSpendUsd: totals.previousSpend,
        calls: totals.calls,
        previousCalls: totals.previousCalls,
        tokens: totals.tokens,
        previousTokens: totals.previousTokens,
        cacheShare: totals.inputTokens > 0 ? totals.cacheReadTokens / totals.inputTokens : 0,
        managedCredits: totals.managedCredits,
    }
}

function seriesOf({ rows, resolved, since }: { rows: UsageRow[], resolved: ResolvedPeriod, since: number | null }): AiUsageSeriesPoint[] {
    const bySlot = new Map(rows.map((row) => [row.slot, row]))
    const untracked = (slotStart: number): boolean => !isNil(since) && slotStart + resolved.stepMs <= since
    return Array.from({ length: resolved.slotCount }, (_, slot) => {
        const row = bySlot.get(slot) ?? EMPTY_ROW
        const currentMissing = untracked(resolved.current.start.getTime() + slot * resolved.stepMs)
        const previousMissing = slot >= resolved.previousSlotCount || untracked(resolved.previous.start.getTime() + slot * resolved.stepMs)
        return {
            label: aiUsagePeriod.labelOf({ resolved, slot }),
            spendUsd: currentMissing ? null : row.spend,
            calls: currentMissing ? null : row.calls,
            tokens: currentMissing ? null : row.tokens,
            previousSpendUsd: previousMissing ? null : row.previousSpend,
            previousCalls: previousMissing ? null : row.previousCalls,
            previousTokens: previousMissing ? null : row.previousTokens,
        }
    })
}

function bySourceOf(rows: UsageRow[]): AiUsageSourceSpend[] {
    const spendBySource = rows.reduce((totals, row) => {
        const origin = ORIGINS.find((value) => value === row.origin)
        if (isNil(origin)) {
            return totals
        }
        const source = aiUsageDimension.sourceOf(origin)
        return new Map([...totals, [source, (totals.get(source) ?? 0) + row.spend]])
    }, new Map<AiUsageSource, number>())
    return [...spendBySource.entries()]
        .filter(([, spendUsd]) => spendUsd > 0)
        .sort(([, a], [, b]) => b - a)
        .map(([source, spendUsd]) => ({ source, spendUsd }))
}

function itemOf({ dimension, row, names, prices, comparable }: ItemParams): AiUsageItem | null {
    const keys = keysOf(row)
    const id = aiUsageDimension.idOf({ dimension, keys })
    if (isNil(id)) {
        return null
    }
    const named = names.of({ dimension, id })
    const providerName = keys.provider ?? named?.provider ?? null
    const provider = isNil(providerName) ? null : aiUsageDimension.providerOf(providerName)
    const price = dimension === 'model' && !isNil(provider) && !isNil(keys.modelId) ? prices({ provider, modelId: keys.modelId }) : undefined
    return {
        dimension,
        id,
        name: dimension === 'model' ? keys.modelId : named?.name ?? null,
        ...(isNil(named?.parent) ? {} : { parent: named.parent }),
        ...((dimension === 'key' || dimension === 'model') && !isNil(provider) ? { provider } : {}),
        ...(dimension === 'project' ? { flowCount: row.flowCount ?? 0, agentCount: row.agentCount ?? 0 } : {}),
        spendUsd: row.spend,
        previousSpendUsd: row.previousSpend,
        calls: row.calls,
        tokens: row.tokens,
        comparable: comparable && row.previousSpend > 0,
        ...((dimension === 'flow' || dimension === 'agent') ? { sharedUsd: row.sharedUsd } : {}),
        ...(isNil(price?.inputCostPerMillionTokens) ? {} : { inputPrice: price.inputCostPerMillionTokens }),
        ...(isNil(price?.outputCostPerMillionTokens) ? {} : { outputPrice: price.outputCostPerMillionTokens }),
    }
}

function keysOf(row: UsageRow): DimensionKeys {
    return {
        projectId: row.projectId ?? null,
        flowId: row.flowId ?? null,
        agentId: row.agentId ?? null,
        userId: row.userId ?? null,
        provider: row.provider ?? null,
        providerConfigId: row.providerConfigId ?? null,
        modelId: row.modelId ?? null,
    }
}

function idsToName({ groups, extra }: { groups: { dimension: AiUsageDimension, rows: UsageRow[] }[], extra?: { dimension: AiUsageDimension, id: string } }): Partial<Record<AiUsageDimension, string[]>> {
    const pairs = [
        ...groups.flatMap(({ dimension, rows }) => rows.map((row) => ({ dimension, id: aiUsageDimension.idOf({ dimension, keys: keysOf(row) }) }))),
        ...(isNil(extra) ? [] : [extra]),
    ]
    return pairs.reduce<Partial<Record<AiUsageDimension, string[]>>>((ids, { dimension, id }) => isNil(id) ? ids : { ...ids, [dimension]: [...(ids[dimension] ?? []), id] }, {})
}

async function priceBook(): Promise<ItemParams['prices']> {
    const catalog = await modelCatalog.load()
    return ({ provider, modelId }) => catalog.lookup({ provider, modelId })
}

async function cachedView<T>({ key, ttlSeconds, compute }: { key: string, ttlSeconds: number, compute: () => Promise<T> }): Promise<T> {
    const { data: hit } = await tryCatch(() => distributedStore.get<T>(key))
    if (!isNil(hit)) {
        return hit
    }
    const value = await compute()
    await tryCatch(() => distributedStore.put(key, value, ttlSeconds))
    return value
}

function cacheKeyOf({ platformId, endpoint, dimension, id, period, scope, resolved }: CacheKeyParams): string {
    return `${CACHE_PREFIX}:${platformId}:${endpoint}:${dimension ?? '*'}:${id ?? '*'}:${period}:${scope}:${resolved.current.start.toISOString()}:${resolved.current.end.toISOString()}`
}

function setsWithHelpers(sets: SetName[]): SetName[] {
    const helpers: SetName[] = sets.includes('project') ? ['flow', 'projectAgent'] : []
    return [...new Set([...sets, ...helpers])]
}

async function sinceOf({ platformId, log }: { platformId: string, log: FastifyBaseLogger }): Promise<number | null> {
    const [first, platform] = await Promise.all([trackingStart(), platformService(log).getOneOrThrow(platformId)])
    return isNil(first) ? null : Math.max(first, new Date(platform.created).getTime())
}

function keysOfItem(conditions: DimensionCondition[] | null): Partial<UsageRow> {
    const values = Object.fromEntries((conditions ?? []).map(({ column, value }) => [column, value]))
    return {
        projectId: values['projectId'] ?? null,
        flowId: values['flowId'] ?? null,
        agentId: values['agentId'] ?? null,
        userId: values['userId'] ?? null,
        provider: values['provider'] ?? null,
        providerConfigId: values['providerConfigId'] ?? null,
        modelId: values['modelId'] ?? null,
    }
}

function rangesOf(resolved: ResolvedPeriod): AiUsageOverview['ranges'] {
    return {
        current: { start: resolved.current.start.toISOString(), end: resolved.current.end.toISOString() },
        previous: { start: resolved.previous.start.toISOString(), end: resolved.previous.end.toISOString() },
    }
}

const GROUP_COLUMNS = ['slot', 'origin', 'projectId', 'flowId', 'agentId', 'userId', 'provider', 'providerConfigId', 'modelId'] as const

const SETS: Record<SetName, readonly GroupColumn[]> = {
    total: [],
    slot: ['slot'],
    origin: ['origin'],
    project: ['projectId'],
    flow: ['projectId', 'flowId'],
    projectAgent: ['projectId', 'agentId'],
    agent: ['agentId'],
    user: ['userId'],
    key: ['provider', 'providerConfigId'],
    model: ['provider', 'modelId'],
}

const REQUIRED_KEY: Partial<Record<SetName, GroupColumn>> = {
    flow: 'flowId',
    projectAgent: 'agentId',
    agent: 'agentId',
    user: 'userId',
}

const DIMENSION_SETS: Record<AiUsageDimension, SetName> = {
    project: 'project',
    flow: 'flow',
    agent: 'agent',
    user: 'user',
    key: 'key',
    model: 'model',
}

const SCOPE_ENVIRONMENT: Record<AiUsageScope, AiUsageEnvironment | null> = {
    all: null,
    production: AiUsageEnvironment.PRODUCTION,
    testing: AiUsageEnvironment.TESTING,
}

const EMPTY_ROW: UsageRow = {
    g: 0,
    spend: 0,
    previousSpend: 0,
    calls: 0,
    previousCalls: 0,
    tokens: 0,
    previousTokens: 0,
    inputTokens: 0,
    cacheReadTokens: 0,
    managedCredits: 0,
    runs: 0,
    reportedUsd: 0,
    estimatedUsd: 0,
    sharedUsd: 0,
    rank: 0,
    setCount: 0,
    setSpend: 0,
    hasAnyUsage: false,
}

const ORIGINS = Object.values(AiUsageOrigin)
const AI_USAGE_DIMENSIONS_IN_ORDER: AiUsageDimension[] = ['project', 'flow', 'agent', 'user', 'key', 'model']
const TOP_SIZE = 5
const LIST_LIMIT = 1000
const STATEMENT_TIMEOUT_MS = 5000
const CACHE_PREFIX = 'ai-usage:v1'
const TRACKING_START_KEY = 'first'
const TRACKING_START_TTL_MS = 60 * 60 * 1000
const trackingStartCache = lru<number>(1, TRACKING_START_TTL_MS)

export const aiUsageReadService = (log: FastifyBaseLogger) => ({
    async overview({ platformId, period, scope }: { platformId: string, period: AiUsagePeriod, scope: AiUsageScope }): Promise<AiUsageOverview> {
        const now = new Date()
        const resolved = aiUsagePeriod.resolve({ period, now })
        return cachedView({
            key: cacheKeyOf({ platformId, endpoint: 'overview', period, scope, resolved }),
            ttlSeconds: resolved.ttlSeconds,
            compute: async () => {
                const rankedSets: SetName[] = ['project', 'flow', 'agent', 'user', 'key', 'model']
                const query = buildQuery({ platformId, resolved, scope, conditions: [], sets: setsWithHelpers(['total', 'slot', 'origin', ...rankedSets]), rankedSets, alwaysSets: ['total', 'slot', 'origin'], topN: TOP_SIZE })
                const [rows, since, prices] = await Promise.all([queryRows(query), sinceOf({ platformId, log }), priceBook()])
                const setRows = (set: SetName): UsageRow[] => rows.filter((row) => row.g === query.maskFor(set))
                const history = historyOf({ resolved, since, hasAnyUsage: rows[0]?.hasAnyUsage ?? false, now: now.getTime() })
                const groups = AI_USAGE_DIMENSIONS_IN_ORDER.map((dimension) => ({ dimension, rows: setRows(DIMENSION_SETS[dimension]) }))
                const names = await aiUsageNames.lookup({ platformId, ids: idsToName({ groups }) })
                const itemsOf = (dimension: AiUsageDimension): AiUsageItem[] => setRows(DIMENSION_SETS[dimension])
                    .flatMap((row) => itemOf({ dimension, row, names, prices, comparable: history.comparable }) ?? [])
                return {
                    history,
                    ranges: rangesOf(resolved),
                    totals: totalsOf(setRows('total')[0]),
                    series: seriesOf({ rows: setRows('slot'), resolved, since }),
                    bySource: bySourceOf(setRows('origin')),
                    top: {
                        project: itemsOf('project'),
                        flow: itemsOf('flow'),
                        agent: itemsOf('agent'),
                        user: itemsOf('user'),
                        key: itemsOf('key'),
                        model: itemsOf('model'),
                    },
                }
            },
        })
    },
    async items({ platformId, period, scope, dimension }: { platformId: string, period: AiUsagePeriod, scope: AiUsageScope, dimension: AiUsageDimension }): Promise<AiUsageItemList> {
        const now = new Date()
        const resolved = aiUsagePeriod.resolve({ period, now })
        return cachedView({
            key: cacheKeyOf({ platformId, endpoint: 'items', dimension, period, scope, resolved }),
            ttlSeconds: resolved.ttlSeconds,
            compute: async () => {
                const set = DIMENSION_SETS[dimension]
                const query = buildQuery({ platformId, resolved, scope, conditions: [], sets: setsWithHelpers(['total', set]), rankedSets: [set], alwaysSets: ['total'], topN: LIST_LIMIT })
                const [rows, since, prices] = await Promise.all([queryRows(query), sinceOf({ platformId, log }), priceBook()])
                const listRows = rows.filter((row) => row.g === query.maskFor(set))
                const history = historyOf({ resolved, since, hasAnyUsage: rows[0]?.hasAnyUsage ?? false, now: now.getTime() })
                const names = await aiUsageNames.lookup({ platformId, ids: idsToName({ groups: [{ dimension, rows: listRows }] }) })
                const items = listRows.flatMap((row) => itemOf({ dimension, row, names, prices, comparable: history.comparable }) ?? [])
                const count = listRows[0]?.setCount ?? 0
                return {
                    history,
                    ranges: rangesOf(resolved),
                    items,
                    count,
                    itemsSpendUsd: listRows[0]?.setSpend ?? 0,
                    totalSpendUsd: rows.find((row) => row.g === query.maskFor('total'))?.spend ?? 0,
                    truncated: count > items.length,
                }
            },
        })
    },
    async detail({ platformId, period, scope, dimension, id }: { platformId: string, period: AiUsagePeriod, scope: AiUsageScope, dimension: AiUsageDimension, id: string }): Promise<AiUsageDetail> {
        const now = new Date()
        const resolved = aiUsagePeriod.resolve({ period, now })
        return cachedView({
            key: cacheKeyOf({ platformId, endpoint: 'detail', dimension, id, period, scope, resolved }),
            ttlSeconds: resolved.ttlSeconds,
            compute: async () => {
                const conditions = aiUsageDimension.filterOf({ dimension, id })
                const related = AI_USAGE_RELATED_DIMENSIONS[dimension]
                const rankedSets = related.map((relatedDimension) => DIMENSION_SETS[relatedDimension])
                const withSource = AI_USAGE_SOURCE_DIMENSIONS.includes(dimension)
                const alwaysSets: SetName[] = withSource ? ['total', 'slot', 'origin'] : ['total', 'slot']
                const query = buildQuery({ platformId, resolved, scope, conditions: conditions ?? [], sets: setsWithHelpers([...alwaysSets, ...rankedSets]), rankedSets, alwaysSets, topN: TOP_SIZE })
                const [rows, since, prices] = await Promise.all([isNil(conditions) ? Promise.resolve([]) : queryRows(query), sinceOf({ platformId, log }), priceBook()])
                const setRows = (set: SetName): UsageRow[] => rows.filter((row) => row.g === query.maskFor(set))
                const history = historyOf({ resolved, since, hasAnyUsage: rows[0]?.hasAnyUsage ?? false, now: now.getTime() })
                const groups = related.map((relatedDimension) => ({ dimension: relatedDimension, rows: setRows(DIMENSION_SETS[relatedDimension]) }))
                const names = await aiUsageNames.lookup({ platformId, ids: idsToName({ groups, extra: { dimension, id } }) })
                const totalRow = setRows('total')[0] ?? EMPTY_ROW
                const itemRow: UsageRow = {
                    ...totalRow,
                    ...keysOfItem(conditions),
                    flowCount: setRows('flow')[0]?.setCount ?? 0,
                    agentCount: setRows('agent')[0]?.setCount ?? 0,
                }
                const item = itemOf({ dimension, row: itemRow, names, prices, comparable: history.comparable }) ?? { dimension, id, name: null, spendUsd: 0, previousSpendUsd: 0, calls: 0, tokens: 0, comparable: false }
                return {
                    history,
                    ranges: rangesOf(resolved),
                    item: { ...item, id },
                    series: seriesOf({ rows: setRows('slot'), resolved, since }),
                    related: Object.fromEntries(groups.map(({ dimension: relatedDimension, rows: relatedRows }) => [
                        relatedDimension,
                        relatedRows.flatMap((row) => itemOf({ dimension: relatedDimension, row, names, prices, comparable: history.comparable }) ?? []),
                    ])),
                    ...(withSource ? { bySource: bySourceOf(setRows('origin')) } : {}),
                    ...(dimension === 'flow' ? { runs: totalRow.runs } : {}),
                    ...(dimension === 'key' ? { reportedUsd: totalRow.reportedUsd, estimatedUsd: totalRow.estimatedUsd } : {}),
                }
            },
        })
    },
})

type GroupColumn = typeof GROUP_COLUMNS[number]

type SetName = 'total' | 'slot' | 'origin' | 'project' | 'flow' | 'projectAgent' | 'agent' | 'user' | 'key' | 'model'

type QueryParams = {
    platformId: string
    resolved: ResolvedPeriod
    scope: AiUsageScope
    conditions: DimensionCondition[]
    sets: SetName[]
    rankedSets: SetName[]
    alwaysSets: SetName[]
    topN: number
}

type BuiltQuery = {
    sql: string
    values: unknown[]
    maskFor: (set: SetName) => number
}

type UsageRow = {
    g: number
    slot?: number | null
    origin?: string | null
    projectId?: string | null
    flowId?: string | null
    agentId?: string | null
    userId?: string | null
    provider?: string | null
    providerConfigId?: string | null
    modelId?: string | null
    spend: number
    previousSpend: number
    calls: number
    previousCalls: number
    tokens: number
    previousTokens: number
    inputTokens: number
    cacheReadTokens: number
    managedCredits: number
    runs: number
    reportedUsd: number
    estimatedUsd: number
    sharedUsd: number
    rank: number
    setCount: number
    setSpend: number
    flowCount?: number
    agentCount?: number
    hasAnyUsage: boolean
}

type ItemParams = {
    dimension: AiUsageDimension
    row: UsageRow
    names: NameBook
    prices: (params: { provider: AIProviderName, modelId: string }) => AIProviderModelMetadata | undefined
    comparable: boolean
}

type CacheKeyParams = {
    platformId: string
    endpoint: 'overview' | 'items' | 'detail'
    dimension?: AiUsageDimension
    id?: string
    period: AiUsagePeriod
    scope: AiUsageScope
    resolved: ResolvedPeriod
}
