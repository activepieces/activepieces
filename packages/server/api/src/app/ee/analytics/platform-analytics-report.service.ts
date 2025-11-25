import { ApplicationEventName } from '@activepieces/ee-shared'
import { AnalyticsPieceReportItem, AnalyticsProjectReportItem, AnalyticsRunsUsageItem, apId, flowPieceUtil, FlowStatus, FlowVersionState, isNil, PieceCategory, PlatformAnalyticsReport, PlatformId, PopulatedFlow, RunEnvironment } from '@activepieces/shared'
import dayjs from 'dayjs'
import { FastifyBaseLogger } from 'fastify'
import { repoFactory } from '../../core/db/repo-factory'
import { distributedLock } from '../../database/redis-connections'
import { flowService } from '../../flows/flow/flow.service'
import { flowRunRepo } from '../../flows/flow-run/flow-run-service'
import { pieceMetadataService } from '../../pieces/metadata/piece-metadata-service'
import { projectRepo } from '../../project/project-service'
import { userRepo } from '../../user/user-service'
import { PlatformAnalyticsReportEntity } from './platform-analytics-report.entity'
export const platformAnalyticsReportRepo = repoFactory(PlatformAnalyticsReportEntity)

export const platformAnalyticsReportService = (log: FastifyBaseLogger) => ({
    refreshReport: async (platformId: PlatformId) => {
        await distributedLock(log).runExclusive({
            key: `platform-analytics-report-${platformId}`,
            timeoutInSeconds: 30,
            fn: async () => {
                await refreshReport(platformId, log)
            },
        })
        return platformAnalyticsReportRepo().findOneBy({ platformId })
    },
    getOrGenerateReport: async (platformId: PlatformId): Promise<PlatformAnalyticsReport> => {
        const report = await platformAnalyticsReportRepo().findOneBy({ platformId })
        if (report) {
            return report
        }
        return refreshReport(platformId, log)
    },
})



const refreshReport = async (platformId: PlatformId, log: FastifyBaseLogger): Promise<PlatformAnalyticsReport> => {
    const report = await platformAnalyticsReportRepo().findOneBy({ platformId })
    const generatedReport = await generateReport({
        platformId,
        log,
        id: report?.id ?? apId(),
    })
    return platformAnalyticsReportRepo().save(generatedReport)

}



const generateReport = async ({ platformId, log, id }: { platformId: PlatformId, log: FastifyBaseLogger, id: string }): Promise<PlatformAnalyticsReport> => {
    const flows = await listAllFlows(log, platformId)
    const activeFlows = countFlows(flows, FlowStatus.ENABLED)
    const totalFlows = countFlows(flows, undefined)
    const totalProjects = await countProjects(platformId)
    const { totalUsers, activeUsers } = await analyzeUsers(platformId)
    const { uniquePiecesUsed, topPieces } = await analyzePieces(log, flows, platformId)
    const activeFlowsWithAI = await numberOfFlowsWithAI(log, flows, platformId)
    const { topProjects, activeProjects } = await analyzeProjects(flows)
    const runsUsage = await analyzeRuns(platformId)
    return {
        totalUsers,
        activeUsers,
        activeFlows,
        totalFlows,
        totalProjects,
        uniquePiecesUsed,
        activeFlowsWithAI,
        topProjects,
        activeProjects,
        topPieces,
        runsUsage,
        platformId,
        created: dayjs().toISOString(),
        updated: dayjs().toISOString(),
        id,
    }
}

async function analyzeProjects(flows: PopulatedFlow[]) {
    const projectUsage: Record<string, AnalyticsProjectReportItem> = {}
    for (const flow of flows) {
        const projectId = flow.projectId
        const project = await projectRepo().findOneByOrFail({ id: projectId })
        if (!projectUsage[projectId]) {
            projectUsage[projectId] = { id: projectId, activeFlows: 0, totalFlows: 0, displayName: project.displayName }
        }
        projectUsage[projectId].totalFlows += 1
        if (flow.status === FlowStatus.ENABLED) {
            projectUsage[projectId].activeFlows += 1
        }
    }
    return {
        topProjects: Object.values(projectUsage).map(({ id, activeFlows, totalFlows, displayName }) => ({
            id,
            activeFlows,
            displayName,
            totalFlows,
        })),
        activeProjects: Object.values(projectUsage).filter(project => project.activeFlows > 0).length,
    }
}


async function numberOfFlowsWithAI(log: FastifyBaseLogger, flows: PopulatedFlow[], platformId: PlatformId) {
    const aiPiecePromises = flows.flatMap(flow => {
        const usedPieces = flowPieceUtil.getUsedPieces(flow.version.trigger)
        return usedPieces.map(piece => pieceMetadataService(log).get({
            name: piece,
            version: undefined,
            projectId: flow.projectId,
            platformId,
            entityManager: undefined,
        }))
    }).filter((f) => f !== undefined)
    const pieceMetadataList = await Promise.all(aiPiecePromises)
    return pieceMetadataList.filter(pieceMetadata => pieceMetadata?.categories?.includes(PieceCategory.ARTIFICIAL_INTELLIGENCE)).length
}

async function analyzePieces(log: FastifyBaseLogger, flows: PopulatedFlow[], platformId: PlatformId) {
    const pieces: Record<string, AnalyticsPieceReportItem> = {}
    for (const flow of flows) {
        const usedPieces = flowPieceUtil.getUsedPieces(flow.version.trigger)
        for (const piece of usedPieces) {
            if (!pieces[piece]) {
                const pieceMetadata = await pieceMetadataService(log).get({
                    name: piece,
                    version: undefined,
                    projectId: flow.projectId,
                    platformId,
                    entityManager: undefined,
                })
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
    return {
        uniquePiecesUsed: Object.keys(pieces).length,
        topPieces: Object.entries(pieces).sort((a, b) => b[1].usageCount - a[1].usageCount).map(([_, value]) => value),
    }
}


async function countProjects(platformId: PlatformId) {
    return projectRepo().countBy({
        platformId,
    })
}


async function analyzeUsers(platformId: PlatformId) {
    const oneMonthAgo = dayjs().subtract(1, 'month').toISOString()
    
    const result = await userRepo()
        .createQueryBuilder('user')
        .select('COUNT(DISTINCT user.id)', 'totalUsers')
        .addSelect(subQuery => {
            return subQuery
                .select('COUNT(DISTINCT sub_user.id)')
                .from('user', 'sub_user')
                .innerJoin(
                    'audit_event',
                    'audit_event',
                    'audit_event."userId" = sub_user.id',
                )
                .where('sub_user."platformId" = :platformId')
                .andWhere('audit_event.action IN (:...actions)')
                .andWhere('audit_event.created > :oneMonthAgo')
        }, 'activeUsers')
        .where('user."platformId" = :platformId', { platformId })
        .setParameters({
            actions: [ApplicationEventName.USER_SIGNED_IN, ApplicationEventName.USER_SIGNED_UP],
            oneMonthAgo,
        })
        .getRawOne()
    
    return {
        activeUsers: parseInt(result.activeUsers),
        totalUsers: parseInt(result.totalUsers),
    }
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

function countFlows(flows: PopulatedFlow[], status: FlowStatus | undefined) {
    if (status) {
        return flows.filter(flow => flow.status === status).length
    }
    return flows.length
}

async function analyzeRuns(platformId: PlatformId): Promise<AnalyticsRunsUsageItem[]> {
    const threeMonthsAgo = dayjs().subtract(3, 'months').toDate()
    
    const runsData = await flowRunRepo()
        .createQueryBuilder('flow_run')
        .select('DATE(flow_run.created)', 'day')
        .addSelect('COUNT(*)', 'totalRuns')
        .innerJoin('project', 'project', 'flow_run."projectId" = project.id')
        .where('project."platformId" = :platformId', { platformId })
        .andWhere('flow_run.created >= :threeMonthsAgo', { threeMonthsAgo })
        .andWhere('flow_run.environment = :environment', { environment: RunEnvironment.PRODUCTION })
        .groupBy('DATE(flow_run.created)')
        .orderBy('DATE(flow_run.created)', 'ASC')
        .getRawMany()

    return runsData.map((row) => ({
        day: row.day,
        totalRuns: row.totalRuns,
    }))
}