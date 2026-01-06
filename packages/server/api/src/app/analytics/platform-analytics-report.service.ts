import { PieceMetadataModel } from '@activepieces/pieces-framework'
import { AnalyticsFlowReportItem, AnalyticsPieceReportItem, AnalyticsRunsUsageItem, apId, DEFAULT_ESTIMATED_TIME_SAVED_PER_STEP, flowPieceUtil, FlowVersionState, isNil, PlatformAnalyticsReport, PlatformId, PopulatedFlow, RunEnvironment, spreadIfDefined, UpdatePlatformReportRequest, UserWithMetaInformation } from '@activepieces/shared'
import dayjs from 'dayjs'
import { FastifyBaseLogger } from 'fastify'
import { repoFactory } from '../core/db/repo-factory'
import { distributedLock } from '../database/redis-connections'
import { flowService } from '../flows/flow/flow.service'
import { flowRunRepo } from '../flows/flow-run/flow-run-service'
import { pieceMetadataService } from '../pieces/metadata/piece-metadata-service'
import { userRepo } from '../user/user-service'
import { PlatformAnalyticsReportEntity } from './platform-analytics-report.entity'

export const platformAnalyticsReportRepo = repoFactory(PlatformAnalyticsReportEntity)

export const platformAnalyticsReportService = (log: FastifyBaseLogger) => ({
    refreshReport: async (platformId: PlatformId) => {
        await distributedLock(log).runExclusive({
            key: `platform-analytics-report-${platformId}`,
            timeoutInSeconds: 400,
            fn: async () => {
                await refreshReport(platformId, log)
            },
        })
        return platformAnalyticsReportRepo().findOneBy({ platformId })
    },
    update: async (platformId: PlatformId, request: UpdatePlatformReportRequest) => {
        await platformAnalyticsReportRepo().update({ platformId }, {
            ...spreadIfDefined('estimatedTimeSavedPerStep', request.estimatedTimeSavedPerStep),
            outdated: request.outdated,
        })
    },
    getOrGenerateReport: async (platformId: PlatformId): Promise<PlatformAnalyticsReport> => {
        const report = await platformAnalyticsReportRepo().findOneBy({ platformId })
        if (report && !report.outdated) {
            return report
        }
        return refreshReport(platformId, log)
    },
})



const refreshReport = async (platformId: PlatformId, log: FastifyBaseLogger): Promise<PlatformAnalyticsReport> => {
    const report = await platformAnalyticsReportRepo().findOneBy({ platformId })
    if (!isNil(report) && dayjs(report.updated).add(5, 'minute').isAfter(dayjs())) {
        return report
    }
    const estimatedTimeSavedPerStep = report?.estimatedTimeSavedPerStep ?? DEFAULT_ESTIMATED_TIME_SAVED_PER_STEP
    const flows = await listAllFlows(log, platformId)

    const pieceMetadataMap = await pieceMetadataService(log).getAllUnfiltered(platformId)
    const topPieces = analyzePieces(flows, pieceMetadataMap)

    const runsUsage = await analyzeRuns(platformId, estimatedTimeSavedPerStep)
    const flowsDetails = await analyzeFlowsDetails(platformId, estimatedTimeSavedPerStep)
    const users = await analyzeUsers(platformId)

    return platformAnalyticsReportRepo().save({
        estimatedTimeSavedPerStep: report?.estimatedTimeSavedPerStep,
        outdated: false,
        users,
        topPieces,
        runsUsage,
        flowsDetails,
        platformId,
        created: dayjs().toISOString(),
        updated: dayjs().toISOString(),
        id: report?.id ?? apId(),
    })

}


async function analyzeUsers(platformId: PlatformId): Promise<UserWithMetaInformation[]> {
    const users = await userRepo().find({
        where: {
            platformId,
        },
        relations: {
            identity: true,
        },
    })
    return users.map((user) => {
        return {
            id: user.id,
            email: user.identity.email,
            firstName: user.identity.firstName,
            lastName: user.identity.lastName,
            status: user.status,
            lastActiveDate: user.lastActiveDate,
            platformRole: user.platformRole,
            created: user.created,
            updated: user.updated,
        }
    })
}

function analyzePieces(flows: PopulatedFlow[], pieceMetadataMap: Map<string, PieceMetadataModel>): AnalyticsPieceReportItem[] {
    const pieces: Record<string, AnalyticsPieceReportItem> = {}
    for (const flow of flows) {
        const usedPieces = flowPieceUtil.getUsedPieces(flow.version.trigger)
        for (const piece of usedPieces) {
            if (!pieces[piece]) {
                const pieceMetadata = pieceMetadataMap.get(piece)
                if (!isNil(pieceMetadata)) {
                    pieces[piece] = {
                        name: piece,
                        displayName: pieceMetadata.displayName,
                        logoUrl: pieceMetadata.logoUrl,
                        usageCount: 0,
                    }
                }
            }
            if (!isNil(pieces[piece])) {
                pieces[piece].usageCount += 1
            }
        }
    }
    return Object.entries(pieces).sort((a, b) => b[1].usageCount - a[1].usageCount).map(([_, value]) => value)
}



async function listAllFlows(log: FastifyBaseLogger, platformId: PlatformId): Promise<PopulatedFlow[]> {
    const page = await flowService(log).list({
        platformId,
        cursorRequest: null,
        versionState: FlowVersionState.DRAFT,
        includeTriggerSource: false,
    })

    return page.data
}


async function analyzeRuns(platformId: PlatformId, estimatedTimeSavedPerStep: number): Promise<AnalyticsRunsUsageItem[]> {
    if (isNil(estimatedTimeSavedPerStep)) {
        throw new Error('Estimated time saved per step is required')
    }
    const runsData = await flowRunRepo()
        .createQueryBuilder('flow_run')
        .select('DATE(flow_run.created)', 'day')
        .addSelect('COUNT(*)::int', 'totalRuns')
        .addSelect('COALESCE(SUM(COALESCE(flow."timeSavedPerRun", flow_run."stepsCount" * :estimatedTimeSavedPerStep)), 0)::int', 'minutesSaved')
        .innerJoin('project', 'project', 'flow_run."projectId" = project.id')
        .innerJoin('flow', 'flow', 'flow_run."flowId" = flow.id')
        .where('project."platformId" = :platformId', { platformId })
        .andWhere('flow_run.created >= now() - interval \'3 months\'')
        .andWhere('flow_run.environment = :environment', { environment: RunEnvironment.PRODUCTION })
        .groupBy('DATE(flow_run.created)')
        .orderBy('DATE(flow_run.created)', 'ASC')
        .setParameters({ estimatedTimeSavedPerStep })
        .getRawMany()
    return runsData.map((row) => ({
        day: row.day,
        totalRuns: parseInt(row.totalRuns),
        minutesSaved: parseInt(row.minutesSaved),
    }))
}

async function analyzeFlowsDetails(platformId: PlatformId, estimatedTimeSavedPerStep: number): Promise<AnalyticsFlowReportItem[]> {
    if (isNil(estimatedTimeSavedPerStep)) {
        throw new Error('Estimated time saved per step is required')
    }
    const flowData = await flowRunRepo()
        .createQueryBuilder('flow_run')
        .select('flow.id', 'flowId')
        .addSelect('flow.status', 'status')
        .addSelect('flow."ownerId"', 'ownerId')
        .addSelect('latest_version."displayName"', 'flowName')
        .addSelect('project.id', 'projectId')
        .addSelect('project."displayName"', 'projectName')
        .addSelect('COUNT(*)::int', 'runs')
        .addSelect('flow."timeSavedPerRun"', 'timeSavedPerRun')
        .addSelect('COALESCE(SUM(COALESCE(flow."timeSavedPerRun", flow_run."stepsCount" * :estimatedTimeSavedPerStep)), 0)::int', 'minutesSaved')
        .innerJoin('project', 'project', 'flow_run."projectId" = project.id')
        .innerJoin('flow', 'flow', 'flow_run."flowId" = flow.id')
        .innerJoin('flow_version', 'latest_version', 'latest_version."flowId" = flow.id AND latest_version.id = (SELECT fv.id FROM flow_version fv WHERE fv."flowId" = flow.id ORDER BY fv.created DESC LIMIT 1)')
        .where('project."platformId" = :platformId', { platformId })
        .andWhere('flow_run.environment = :environment', { environment: RunEnvironment.PRODUCTION })
        .groupBy('flow.id')
        .addGroupBy('latest_version."displayName"')
        .addGroupBy('project.id')
        .addGroupBy('project."displayName"')
        .orderBy('COUNT(*)', 'DESC')
        .setParameters({ estimatedTimeSavedPerStep })
        .getRawMany()


    return flowData.map((row) => ({
        flowId: row.flowId,
        status: row.status,
        ownerId: row.ownerId,
        flowName: row.flowName,
        projectId: row.projectId,
        projectName: row.projectName,
        timeSavedPerRun: {
            value: !isNil(row.timeSavedPerRun) ? parseInt(row.timeSavedPerRun) : (
                row.runs > 0 ? parseInt(row.minutesSaved) / parseInt(row.runs) : null
            ),
            isEstimated: isNil(row.timeSavedPerRun),
        },
        minutesSaved: parseInt(row.minutesSaved),
        runs: parseInt(row.runs),
    }))
}