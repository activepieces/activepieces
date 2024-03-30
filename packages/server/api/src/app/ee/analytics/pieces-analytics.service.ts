import { FlowStatus, flowHelper, isNil } from '@activepieces/shared'
import { repoFactory } from '../../core/db/repo-factory'
import { FlowVersionEntity } from '../../flows/flow-version/flow-version-entity'
import { FlowEntity } from '../../flows/flow/flow.entity'
import { getRedisConnection } from '../../database/redis-connection'
import { systemJobsSchedule } from '../../helper/system-jobs'
import { logger } from 'server-shared'
import dayjs from 'dayjs'

const REDIS_KEY = 'analytics:pieces'
const flowRepo = repoFactory(FlowEntity)
const flowVersionRepo = repoFactory(FlowVersionEntity)
export const piecesAnalyticsService = {
    async init(): Promise<void> {
        await systemJobsSchedule.upsertJob({
            job: {
                name: 'pieces-analytics',
                data: {},
            },
            schedule: {
                type: 'repeated',
                cron: '0 12 * * *',
            },
            async handler() {
                const TwentyFiveHours = 25 * 60 * 60 * 1000
                const report = await sync()
                const redis = getRedisConnection()
                await redis.set(REDIS_KEY, JSON.stringify(report))
                await redis.expire(REDIS_KEY, TwentyFiveHours)
            },
        })
    },
    async get(): Promise<PiecesReport | null> {
        const redis = getRedisConnection()
        const cachedReport = await redis.get(REDIS_KEY)
        if (cachedReport) {
            return JSON.parse(cachedReport)
        }
        return null
    },
}


async function sync(): Promise<PiecesReport> {
    const flowIds: string[] = (await flowRepo().createQueryBuilder().select('id').where({
        status: FlowStatus.ENABLED,
    }).getRawMany()).map((flow) => flow.id)
    const piecesReport: PiecesReport = {}
    const activeProjects: Record<string, Set<string>> = {}
    const startTime = dayjs().unix()
    logger.info('syncing pieces analytics')
    for (const flowId of flowIds) {
        const flow = await flowRepo().findOneBy({
            id: flowId,
        })
        const publishedVersionId = flow?.publishedVersionId
        if (isNil(flow) || isNil(publishedVersionId)) {
            continue
        }
        const flowVersion = await flowVersionRepo().findOneBy({
            id: publishedVersionId,
        })
        if (isNil(flowVersion)) {
            continue
        }
        const pieces = flowHelper.getUsedPieces(flowVersion.trigger)
        for (const piece of pieces) {
            if (!piecesReport[piece]) {
                piecesReport[piece] = {
                    projects: {
                        active: 0,
                    },
                    flows: {
                        active: 0,
                    },
                }
            }
            activeProjects[piece] = activeProjects[piece] || new Set()
            activeProjects[piece].add(flow.projectId)
            piecesReport[piece].flows.active++
        }
    }
    for (const piece in activeProjects) {
        piecesReport[piece].projects.active = activeProjects[piece].size
    }
    const endTime = dayjs().unix()
    logger.info(`synced pieces analytics in ${endTime - startTime} seconds`)
    return piecesReport
}

type PieceUsageReport = {
    projects: {
        active: number
    }
    flows: {
        active: number
    }
}

type PiecesReport = {
    [pieceName: string]: PieceUsageReport
}

