import { PlatformId, ProjectId, TriggerRunStatus, TriggerStatusReport } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import Redis from 'ioredis'
import { apDayjs, apDayjsDuration } from './dayjs-helper'
import { redisHelper } from './redis'

export const triggerRunStats = (_log: FastifyBaseLogger, redisConnection: Redis) => ({
    async save({ platformId, pieceName, status }: SaveParams): Promise<void> {
        const day = apDayjs().format('YYYY-MM-DD')
        const statusToStore = status === TriggerRunStatus.COMPLETED ? status : TriggerRunStatus.FAILED
        const redisKey = triggerRunRedisKey(platformId, pieceName, day, statusToStore)

        await redisConnection.incr(redisKey)
        await redisConnection.expire(redisKey, apDayjsDuration(14, 'days').asSeconds())
    },

    async getStatusReport(params: GetStatusReportParams): Promise<TriggerStatusReport> {
        const { platformId } = params
        const redisKeys = await redisHelper.scanAll(redisConnection, triggerRunRedisKey(platformId, '*', '*', '*'))
        if (redisKeys.length === 0) {
            return { pieces: {} }
        }
        const values = await redisConnection.mget(redisKeys)
        const parsedRecords = parseRedisRecords(redisKeys, values)
        return aggregateRecords(parsedRecords)
    },
})

export const triggerRunRedisKey = (platformId: PlatformId, pieceName: string, formattedDate: string, status: TriggerRunStatus | '*') => `trigger_run:${platformId}:${pieceName}:${formattedDate}:${status}`

type ParsedRedisRecord = {
    pieceName: string
    day: string
    status: TriggerRunStatus
    count: number
}

const parseRedisRecords = (redisKeys: string[], values: (string | null)[]): ParsedRedisRecord[] => {
    return redisKeys.map((key, index) => {
        const parts = key.split(':')
        return {
            pieceName: parts[2],
            day: parts[3],
            status: parts[4] as TriggerRunStatus,
            count: Number(values[index]) || 0,
        }
    })
}

const aggregateRecords = (records: ParsedRedisRecord[]): TriggerStatusReport => {
    const pieceNameToDayToStats = new Map<string, Map<string, { success: number, failure: number }>>()

    for (const record of records) {
        if (!pieceNameToDayToStats.has(record.pieceName)) {
            pieceNameToDayToStats.set(record.pieceName, new Map())
        }
        const dayMap = pieceNameToDayToStats.get(record.pieceName)!
        const dayKey = record.day
        if (!dayMap.has(dayKey)) {
            dayMap.set(dayKey, { success: 0, failure: 0 })
        }
        const dayStats = dayMap.get(dayKey)!
        if (record.status === TriggerRunStatus.COMPLETED) {
            dayStats.success += record.count
        }
        else {
            dayStats.failure += record.count
        }
    }
    const pieces: TriggerStatusReport['pieces'] = {}
    for (const [pieceName, dayMap] of pieceNameToDayToStats) {
        const dailyStats: Record<string, { success: number, failure: number }> = {}
        let totalRuns = 0
        for (const [day, stats] of dayMap) {
            dailyStats[day] = stats
            totalRuns += stats.success + stats.failure
        }
        pieces[pieceName] = {
            dailyStats,
            totalRuns,
        }
    }

    return { pieces }
}

type GetStatusReportParams = {
    platformId: ProjectId
}

type SaveParams = {
    platformId: PlatformId
    pieceName: string
    status: TriggerRunStatus
}