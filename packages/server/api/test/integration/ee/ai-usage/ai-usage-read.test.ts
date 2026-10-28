import { AIProviderName, AiUsageEnvironment, AiUsageOrigin, apId } from '@activepieces/core-utils'
import { AiUsageDetail, AiUsageItemList, AiUsageOverview, DefaultProjectRole, FlowVersionState } from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { aiUsageDimension } from '../../../../src/app/ai/usage/ai-usage-dimension'
import { aiUsagePeriod } from '../../../../src/app/ai/usage/ai-usage-period'
import { databaseConnection } from '../../../../src/app/database/database-connection'
import { db } from '../../../helpers/db'
import { createMockFlow, createMockFlowVersion, createMockProject } from '../../../helpers/mocks'
import { createMemberContext, createTestContext, TestContext } from '../../../helpers/test-context'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'

let app: FastifyInstance
let ctx: TestContext
let seriesCounter = 0

beforeAll(async () => {
    app = await setupTestEnvironment()
}, 300_000)

afterAll(async () => {
    await teardownTestEnvironment()
})

beforeEach(async () => {
    ctx = await createTestContext(app, { plan: { aiProvidersEnabled: true } })
    await db.update('platform', ctx.platform.id, { created: '2025-01-01T00:00:00.000Z' })
    await databaseConnection().query(
        'INSERT INTO "ai_usage_copy_cursor" ("platformId", "copiedUntil", "startedAt") VALUES ($1, now(), $2)',
        [ctx.platform.id, '2025-06-01T00:00:00.000Z'],
    )
})

async function seed(row: SeedRow): Promise<void> {
    seriesCounter += 1
    const table = 'bucket' in row ? 'ai_usage_5m' : 'ai_usage_daily'
    const time = 'bucket' in row ? row.bucket : row.day
    await databaseConnection().query(
        `INSERT INTO "${table}" ("${'bucket' in row ? 'bucket' : 'day'}", "seriesId", "platformId", "projectId", "flowId", "agentId", "userId", "provider", "providerConfigId", "modelId", "origin", "environment",
            "calls", "runs", "inputTokens", "outputTokens", "cacheReadTokens", "spendUsd", "reportedCostUsd", "estimatedCostUsd", "managedCredits")
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)`,
        [
            time, String(seriesCounter).padStart(32, '0'), row.platformId ?? ctx.platform.id, row.projectId === undefined ? ctx.project.id : row.projectId,
            row.flowId ?? null, row.agentId ?? null, row.userId ?? null, row.provider ?? AIProviderName.OPENAI, row.providerConfigId ?? null, row.modelId ?? 'gpt-5',
            row.origin ?? AiUsageOrigin.FLOW_STEP, row.environment ?? AiUsageEnvironment.PRODUCTION,
            row.calls ?? 1, row.runs ?? 0, row.inputTokens ?? 0, row.outputTokens ?? 0, row.cacheReadTokens ?? 0,
            row.spendUsd ?? 0, row.reportedCostUsd ?? 0, row.estimatedCostUsd ?? row.spendUsd ?? 0, row.managedCredits ?? 0,
        ],
    )
}

async function saveFlow({ projectId, displayName }: { projectId: string, displayName: string }): Promise<string> {
    const flow = createMockFlow({ projectId })
    await db.save('flow', flow)
    await db.save('flow_version', createMockFlowVersion({ flowId: flow.id, state: FlowVersionState.DRAFT, displayName }))
    return flow.id
}

async function getJson<T>({ url, query }: { url: string, query: Record<string, string> }): Promise<T> {
    const response = await ctx.get(url, query)
    expect(response.statusCode).toBe(StatusCodes.OK)
    return response.json()
}

function daysOf(period: '7d' | '30d' | 'last-month'): { current: string, previous: string, previousLast: string, scaleDay: string | null } {
    const resolved = aiUsagePeriod.resolve({ period, now: new Date() })
    return {
        current: aiUsagePeriod.dayOf(new Date(resolved.current.start.getTime() + aiUsagePeriod.DAY_MS)),
        previous: aiUsagePeriod.dayOf(resolved.previous.start),
        previousLast: aiUsagePeriod.dayOf(new Date(resolved.previous.end.getTime() - aiUsagePeriod.DAY_MS)),
        scaleDay: resolved.scale ? aiUsagePeriod.dayOf(resolved.scale.day) : null,
    }
}

function sum(values: (number | null)[]): number {
    return values.reduce<number>((total, value) => total + (value ?? 0), 0)
}

describe('AI usage read API', () => {
    async function seedPlatform(): Promise<{ invoiceFlowId: string, quietFlowId: string, agentId: string }> {
        const { current, previous } = daysOf('30d')
        const invoiceFlowId = await saveFlow({ projectId: ctx.project.id, displayName: 'Invoice flow' })
        const quietFlowId = await saveFlow({ projectId: ctx.project.id, displayName: 'Quiet flow' })
        const agentId = apId()
        await seed({ day: current, flowId: invoiceFlowId, spendUsd: 10, reportedCostUsd: 6, estimatedCostUsd: 4, calls: 2, runs: 1, inputTokens: 100, outputTokens: 50, cacheReadTokens: 40 })
        await seed({ day: current, flowId: invoiceFlowId, agentId, origin: AiUsageOrigin.FLOW_AGENT_STEP, provider: AIProviderName.ACTIVEPIECES, modelId: 'openai/gpt-5', spendUsd: 5, calls: 1, runs: 1, managedCredits: 50 })
        await seed({ day: current, projectId: null, userId: ctx.user.id, origin: AiUsageOrigin.CHAT, provider: AIProviderName.ANTHROPIC, modelId: 'claude-sonnet-5', spendUsd: 3, calls: 1 })
        await seed({ day: current, flowId: quietFlowId, modelId: 'unpriced-model', spendUsd: 0, calls: 3 })
        await seed({ day: current, flowId: invoiceFlowId, environment: AiUsageEnvironment.TESTING, spendUsd: 7, calls: 1 })
        await seed({ day: previous, flowId: invoiceFlowId, spendUsd: 4, calls: 1 })
        return { invoiceFlowId, quietFlowId, agentId }
    }

    it('overview adds up across totals, series, sources and every card', async () => {
        const { invoiceFlowId, quietFlowId, agentId } = await seedPlatform()
        const overview = await getJson<AiUsageOverview>({ url: '/v1/ai-usage/overview', query: { period: '30d', scope: 'production' } })

        expect(overview.history).toMatchObject({ hasAnyUsage: true, comparable: true })
        expect(overview.totals).toMatchObject({ spendUsd: 18, previousSpendUsd: 4, calls: 7, tokens: 150, cacheShare: 0.4, managedCredits: 50 })
        expect(sum(overview.series.map((point) => point.spendUsd))).toBeCloseTo(18)
        expect(sum(overview.series.map((point) => point.previousSpendUsd))).toBeCloseTo(4)
        expect(overview.bySource).toEqual([
            { source: 'flow-steps', spendUsd: 10 },
            { source: 'agent-steps', spendUsd: 5 },
            { source: 'chat', spendUsd: 3 },
        ])

        expect(overview.top.project.map((item) => [item.id, item.name, item.spendUsd, item.flowCount, item.agentCount])).toEqual([
            [ctx.project.id, ctx.project.displayName, 15, 2, 1],
            ['no-project', null, 3, 0, 0],
        ])
        expect(sum(overview.top.project.map((item) => item.spendUsd))).toBe(overview.totals.spendUsd)

        expect(overview.top.flow.map((item) => [item.id, item.name, item.parent, item.spendUsd, item.sharedUsd])).toEqual([
            [invoiceFlowId, 'Invoice flow', ctx.project.displayName, 15, 5],
            [quietFlowId, 'Quiet flow', ctx.project.displayName, 0, 0],
        ])
        expect(overview.top.agent.map((item) => [item.id, item.spendUsd, item.sharedUsd])).toEqual([[agentId, 5, 5]])
        expect(overview.top.user.map((item) => [item.id, item.parent, item.spendUsd])).toEqual([[ctx.user.id, ctx.userIdentity.email, 3]])
        expect(overview.top.key.map((item) => [item.id, item.provider, item.spendUsd])).toEqual([
            ['unknown-openai', AIProviderName.OPENAI, 10],
            ['activepieces-credits', AIProviderName.ACTIVEPIECES, 5],
            ['unknown-anthropic', AIProviderName.ANTHROPIC, 3],
        ])
        expect(sum(overview.top.key.map((item) => item.spendUsd))).toBe(overview.totals.spendUsd)
        expect(overview.top.model.map((item) => item.name)).toEqual(['gpt-5', 'openai/gpt-5', 'claude-sonnet-5', 'unpriced-model'])
    })

    it('follows the scope', async () => {
        await seedPlatform()
        const all = await getJson<AiUsageOverview>({ url: '/v1/ai-usage/overview', query: { period: '30d', scope: 'all' } })
        const testing = await getJson<AiUsageOverview>({ url: '/v1/ai-usage/overview', query: { period: '30d', scope: 'testing' } })
        expect(all.totals.spendUsd).toBe(25)
        expect(testing.totals.spendUsd).toBe(7)
    })

    it('lists every item of a dimension with the list and platform totals', async () => {
        const { invoiceFlowId } = await seedPlatform()
        const list = await getJson<AiUsageItemList>({ url: '/v1/ai-usage/items', query: { dimension: 'flow', period: '30d', scope: 'production' } })
        expect(list).toMatchObject({ count: 2, itemsSpendUsd: 15, totalSpendUsd: 18, truncated: false })
        expect(list.items[0]).toMatchObject({ id: invoiceFlowId, previousSpendUsd: 4, comparable: true })
    })

    it('details a flow with its runs and related models and keys', async () => {
        const { invoiceFlowId } = await seedPlatform()
        const detail = await getJson<AiUsageDetail>({ url: `/v1/ai-usage/items/flow/${invoiceFlowId}`, query: { period: '30d', scope: 'production' } })
        expect(detail.item).toMatchObject({ id: invoiceFlowId, name: 'Invoice flow', spendUsd: 15, sharedUsd: 5 })
        expect(detail.runs).toBe(2)
        expect(sum((detail.related.model ?? []).map((item) => item.spendUsd))).toBe(15)
        expect(sum(detail.series.map((point) => point.spendUsd))).toBeCloseTo(15)
        expect(detail.bySource).toBeUndefined()
    })

    it('splits a key into reported and estimated cost', async () => {
        await seedPlatform()
        const detail = await getJson<AiUsageDetail>({ url: '/v1/ai-usage/items/key/unknown-openai', query: { period: '30d', scope: 'production' } })
        expect(detail.item).toMatchObject({ provider: AIProviderName.OPENAI, spendUsd: 10 })
        expect(detail).toMatchObject({ reportedUsd: 6, estimatedUsd: 4 })
        expect(sum((detail.related.project ?? []).map((item) => item.spendUsd))).toBe(10)
    })

    it('details platform chat under the no-project id', async () => {
        await seedPlatform()
        const detail = await getJson<AiUsageDetail>({ url: '/v1/ai-usage/items/project/no-project', query: { period: '30d', scope: 'production' } })
        expect(detail.item).toMatchObject({ id: 'no-project', name: null, spendUsd: 3 })
        expect(detail.bySource).toEqual([{ source: 'chat', spendUsd: 3 }])
    })

    it('returns zeros for an id it cannot decode, and for another platform\'s item without its name', async () => {
        const other = await createTestContext(app)
        const secretFlowId = await saveFlow({ projectId: other.project.id, displayName: 'Secret flow' })
        await seed({ platformId: other.platform.id, projectId: other.project.id, day: daysOf('30d').current, flowId: secretFlowId, spendUsd: 99 })

        const foreign = await getJson<AiUsageDetail>({ url: `/v1/ai-usage/items/flow/${secretFlowId}`, query: { period: '30d', scope: 'all' } })
        expect(foreign.item).toMatchObject({ id: secretFlowId, name: null, spendUsd: 0 })
        const garbage = await getJson<AiUsageDetail>({ url: '/v1/ai-usage/items/model/%2A%2A', query: { period: '30d', scope: 'all' } })
        expect(garbage.item).toMatchObject({ spendUsd: 0, calls: 0 })
        const overview = await getJson<AiUsageOverview>({ url: '/v1/ai-usage/overview', query: { period: '30d', scope: 'all' } })
        expect(overview.totals.spendUsd).toBe(0)
    })

    it('keeps a deleted project\'s spend but not its name', async () => {
        const gone = createMockProject({ platformId: ctx.platform.id, ownerId: ctx.user.id, displayName: 'Closed team', deleted: new Date().toISOString() })
        await db.save('project', gone)
        await seed({ day: daysOf('30d').current, projectId: gone.id, spendUsd: 2 })
        const overview = await getJson<AiUsageOverview>({ url: '/v1/ai-usage/overview', query: { period: '30d', scope: 'production' } })
        expect(overview.top.project.map((item) => [item.id, item.name, item.spendUsd])).toEqual([[gone.id, null, 2]])
    })

    it('scales the partial previous day the same way for totals and items', async () => {
        const { current, scaleDay } = daysOf('7d')
        expect(scaleDay).not.toBeNull()
        await seed({ day: scaleDay ?? '', spendUsd: 100, calls: 10 })
        await seed({ day: current, spendUsd: 1 })
        const overview = await getJson<AiUsageOverview>({ url: '/v1/ai-usage/overview', query: { period: '7d', scope: 'production' } })
        const fraction = overview.totals.previousSpendUsd / 100
        expect(fraction).toBeGreaterThanOrEqual(0)
        expect(fraction).toBeLessThanOrEqual(1)
        expect(overview.top.project[0].previousSpendUsd).toBeCloseTo(overview.totals.previousSpendUsd, 6)
        expect(sum(overview.series.map((point) => point.previousSpendUsd))).toBeCloseTo(overview.totals.previousSpendUsd, 6)
    })

    it('keeps every previous-month day in the series of last month', async () => {
        const { previous, previousLast } = daysOf('last-month')
        await seed({ day: previous, spendUsd: 1 })
        await seed({ day: previousLast, spendUsd: 2 })
        const overview = await getJson<AiUsageOverview>({ url: '/v1/ai-usage/overview', query: { period: 'last-month', scope: 'production' } })
        expect(overview.totals.previousSpendUsd).toBe(3)
        expect(sum(overview.series.map((point) => point.previousSpendUsd))).toBe(3)
    })

    it('shows the page at zero for a platform that never used AI', async () => {
        const overview = await getJson<AiUsageOverview>({ url: '/v1/ai-usage/overview', query: { period: 'this-month', scope: 'production' } })
        expect(overview.history.hasAnyUsage).toBe(false)
        expect(overview.totals.spendUsd).toBe(0)
        expect(overview.series.every((point) => point.spendUsd === 0)).toBe(true)
        expect(overview.top.project).toEqual([])
    })

    it('serves a repeated view from the cache', async () => {
        const { current } = daysOf('30d')
        await seed({ day: current, spendUsd: 1 })
        const first = await getJson<AiUsageOverview>({ url: '/v1/ai-usage/overview', query: { period: '30d', scope: 'production' } })
        await seed({ day: current, spendUsd: 5 })
        const second = await getJson<AiUsageOverview>({ url: '/v1/ai-usage/overview', query: { period: '30d', scope: 'production' } })
        expect(second.totals.spendUsd).toBe(first.totals.spendUsd)
    })

    it('starts tracking at the platform\'s copy cursor, so an earlier period is not compared', async () => {
        await databaseConnection().query('UPDATE "ai_usage_copy_cursor" SET "startedAt" = now() WHERE "platformId" = $1', [ctx.platform.id])
        await seed({ day: daysOf('7d').current, spendUsd: 1 })
        const overview = await getJson<AiUsageOverview>({ url: '/v1/ai-usage/overview', query: { period: '7d', scope: 'production' } })
        expect(overview.history.comparable).toBe(false)
        expect(overview.history.currentCoverage).toBeLessThan(1)
    })

    it('is for platform admins only', async () => {
        const member = await createMemberContext(app, ctx, { projectRole: DefaultProjectRole.ADMIN })
        const response = await member.get('/v1/ai-usage/overview', { period: '30d', scope: 'production' })
        expect(response.statusCode).toBe(StatusCodes.FORBIDDEN)
    })

    it('encodes model ids that the detail endpoint reads back', async () => {
        await seedPlatform()
        const id = aiUsageDimension.idOf({ dimension: 'model', keys: { projectId: null, flowId: null, agentId: null, userId: null, provider: AIProviderName.ANTHROPIC, providerConfigId: null, modelId: 'claude-sonnet-5' } }) ?? ''
        const detail = await getJson<AiUsageDetail>({ url: `/v1/ai-usage/items/model/${id}`, query: { period: '30d', scope: 'production' } })
        expect(detail.item).toMatchObject({ name: 'claude-sonnet-5', provider: AIProviderName.ANTHROPIC, spendUsd: 3 })
    })
})

type SeedRow = ({ day: string } | { bucket: string }) & {
    platformId?: string
    projectId?: string | null
    flowId?: string
    agentId?: string
    userId?: string
    provider?: AIProviderName
    providerConfigId?: string
    modelId?: string
    origin?: AiUsageOrigin
    environment?: AiUsageEnvironment
    calls?: number
    runs?: number
    inputTokens?: number
    outputTokens?: number
    cacheReadTokens?: number
    spendUsd?: number
    reportedCostUsd?: number
    estimatedCostUsd?: number
    managedCredits?: number
}
