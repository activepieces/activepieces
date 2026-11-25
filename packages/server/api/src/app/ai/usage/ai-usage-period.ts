import { AiUsagePeriod } from '@activepieces/shared'

function subDay({ now, spanMinutes, stepMinutes, ttlSeconds }: SubDayParams): ResolvedPeriod {
    const span = spanMinutes * MINUTE_MS
    const end = Math.floor(now.getTime() / FIVE_MINUTES_MS) * FIVE_MINUTES_MS + FIVE_MINUTES_MS
    const start = end - span
    const slotCount = spanMinutes / stepMinutes
    return {
        table: 'ai_usage_5m',
        stepMs: stepMinutes * MINUTE_MS,
        current: { start: new Date(start), end: new Date(end) },
        previous: { start: new Date(start - span), end: new Date(start) },
        slotCount,
        previousSlotCount: slotCount,
        scale: null,
        ttlSeconds,
    }
}

function lastDays({ now, days, ttlSeconds }: { now: Date, days: number, ttlSeconds: number }): ResolvedPeriod {
    const today = dayStart(now)
    const currentStart = today - (days - 1) * DAY_MS
    return daily({
        now,
        current: { start: currentStart, end: today + DAY_MS },
        previous: { start: currentStart - days * DAY_MS, end: currentStart },
        ttlSeconds,
    })
}

function thisMonth(now: Date): ResolvedPeriod {
    const today = dayStart(now)
    const monthStart = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)
    const previousStart = Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1)
    const daysSoFar = (today - monthStart) / DAY_MS + 1
    const previousDays = Math.min(daysSoFar, (monthStart - previousStart) / DAY_MS)
    return daily({
        now,
        current: { start: monthStart, end: today + DAY_MS },
        previous: { start: previousStart, end: previousStart + previousDays * DAY_MS },
        ttlSeconds: THIS_MONTH_TTL_SECONDS,
    })
}

function lastMonth(now: Date): ResolvedPeriod {
    const year = now.getUTCFullYear()
    const month = now.getUTCMonth()
    return daily({
        now,
        current: { start: Date.UTC(year, month - 1, 1), end: Date.UTC(year, month, 1) },
        previous: { start: Date.UTC(year, month - 2, 1), end: Date.UTC(year, month - 1, 1) },
        ttlSeconds: LAST_MONTH_TTL_SECONDS,
    })
}

function daily({ now, current, previous, ttlSeconds }: DailyParams): ResolvedPeriod {
    const slotCount = (current.end - current.start) / DAY_MS
    return {
        table: 'ai_usage_daily',
        stepMs: DAY_MS,
        current: { start: new Date(current.start), end: new Date(current.end) },
        previous: { start: new Date(previous.start), end: new Date(previous.end) },
        slotCount,
        previousSlotCount: Math.min(slotCount, (previous.end - previous.start) / DAY_MS),
        scale: scaleOf({ now, current, previous }),
        ttlSeconds,
    }
}

function scaleOf({ now, current, previous }: Pick<DailyParams, 'now' | 'current' | 'previous'>): ResolvedPeriod['scale'] {
    const today = dayStart(now)
    if (current.end <= now.getTime()) {
        return null
    }
    const day = previous.start + (today - current.start)
    if (day >= previous.end) {
        return null
    }
    return { day: new Date(day), fraction: (now.getTime() - today) / DAY_MS }
}

function dayStart(date: Date): number {
    return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
}

const MINUTE_MS = 60 * 1000
const FIVE_MINUTES_MS = 5 * MINUTE_MS
const DAY_MS = 24 * 60 * MINUTE_MS
const THIS_MONTH_TTL_SECONDS = 600
const LAST_MONTH_TTL_SECONDS = 3600

export const aiUsagePeriod = {
    resolve({ period, now }: { period: AiUsagePeriod, now: Date }): ResolvedPeriod {
        switch (period) {
            case '1h':
                return subDay({ now, spanMinutes: 60, stepMinutes: 5, ttlSeconds: 60 })
            case '6h':
                return subDay({ now, spanMinutes: 6 * 60, stepMinutes: 15, ttlSeconds: 60 })
            case '12h':
                return subDay({ now, spanMinutes: 12 * 60, stepMinutes: 30, ttlSeconds: 120 })
            case '24h':
                return subDay({ now, spanMinutes: 24 * 60, stepMinutes: 60, ttlSeconds: 120 })
            case '7d':
                return lastDays({ now, days: 7, ttlSeconds: 300 })
            case '30d':
                return lastDays({ now, days: 30, ttlSeconds: 600 })
            case '90d':
                return lastDays({ now, days: 90, ttlSeconds: 900 })
            case 'this-month':
                return thisMonth(now)
            case 'last-month':
                return lastMonth(now)
        }
    },
    labelOf({ resolved, slot }: { resolved: ResolvedPeriod, slot: number }): string {
        const iso = new Date(resolved.current.start.getTime() + slot * resolved.stepMs).toISOString()
        return resolved.table === 'ai_usage_daily' ? iso.slice(0, 10) : iso
    },
    dayOf(date: Date): string {
        return date.toISOString().slice(0, 10)
    },
    DAY_MS,
}

export type ResolvedPeriod = {
    table: 'ai_usage_5m' | 'ai_usage_daily'
    stepMs: number
    current: TimeRange
    previous: TimeRange
    slotCount: number
    previousSlotCount: number
    scale: { day: Date, fraction: number } | null
    ttlSeconds: number
}

export type TimeRange = {
    start: Date
    end: Date
}

type SubDayParams = {
    now: Date
    spanMinutes: number
    stepMinutes: number
    ttlSeconds: number
}

type DailyParams = {
    now: Date
    current: { start: number, end: number }
    previous: { start: number, end: number }
    ttlSeconds: number
}
