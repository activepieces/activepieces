import { ApplicationEventName } from '@activepieces/ee-shared'
import { PieceMetadataModel } from '@activepieces/pieces-framework'
import { AnalyticsFlowReportItem, AnalyticsPieceReportItem, AnalyticsProjectReportItem, AnalyticsRunsUsageItem, apId, assertNotNullOrUndefined, flowPieceUtil, FlowStatus, FlowVersionState, isNil, PieceCategory, PlatformAnalyticsReport, PlatformId, PopulatedFlow, RunEnvironment } from '@activepieces/shared'
import dayjs from 'dayjs'
import { FastifyBaseLogger } from 'fastify'
import { repoFactory } from '../../core/db/repo-factory'
import { distributedLock } from '../../database/redis-connections'
import { flowService } from '../../flows/flow/flow.service'
import { flowRunRepo } from '../../flows/flow-run/flow-run-service'
import { pieceMetadataService } from '../../pieces/metadata/piece-metadata-service'
import { projectRepo } from '../../project/project-service'
import { userRepo } from '../../user/user-service'
import { auditLogRepo } from '../audit-logs/audit-event-service'
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
    
    const pieceMetadataMap = await pieceMetadataService(log).getAllUnfiltered(platformId)    
    const topPieces = analyzePieces(flows, pieceMetadataMap)
    const activeFlowsWithAI = numberOfFlowsWithAI(flows, pieceMetadataMap)

    const topProjects = await analyzeProjects(flows)
    const { runsUsage, totalFlowRuns, totalMinutesSaved } = await analyzeRuns(platformId)
    const flowsDetails = await analyzeFlowsDetails(platformId)
    
    return {
        totalUsers,
        activeUsers,
        activeFlows,
        totalFlows,
        totalProjects,
        activeFlowsWithAI,
        totalFlowRuns,
        totalMinutesSaved,
        topProjects,
        topPieces,
        runsUsage,
        flowsDetails,
        platformId,
        created: dayjs().toISOString(),
        updated: dayjs().toISOString(),
        id,
    }
}

async function analyzeProjects(flows: PopulatedFlow[]): Promise<AnalyticsProjectReportItem[]> {
    const projectIds = [...new Set(flows.map(flow => flow.projectId))]
    const projects = await projectRepo().findBy(projectIds.map(id => ({ id })))
    const projectMap = new Map(projects.map(project => [project.id, project]))

    const projectUsage: Record<string, AnalyticsProjectReportItem> = {}
    for (const flow of flows) {
        const projectId = flow.projectId
        const project = projectMap.get(projectId)
        assertNotNullOrUndefined(project, 'project')
        if (!projectUsage[projectId]) {
            projectUsage[projectId] = { id: projectId, activeFlows: 0, totalFlows: 0, displayName: project.displayName }
        }
        projectUsage[projectId].totalFlows += 1
        if (flow.status === FlowStatus.ENABLED) {
            projectUsage[projectId].activeFlows += 1
        }
    }
    return Object.values(projectUsage).map(({ id, activeFlows, totalFlows, displayName }) => ({
        id,
        activeFlows,
        displayName,
        totalFlows,
    }))
}



function numberOfFlowsWithAI(flows: PopulatedFlow[], pieceMetadataMap: Map<string, PieceMetadataModel>): number {
    let count = 0
    for (const flow of flows) {
        const usedPieces = flowPieceUtil.getUsedPieces(flow.version.trigger)
        const hasAIPiece = usedPieces.some(pieceName => {
            const metadata = pieceMetadataMap.get(pieceName)
            return metadata?.categories?.includes(PieceCategory.ARTIFICIAL_INTELLIGENCE)
        })
        if (hasAIPiece) {
            count++
        }
    }
    return count
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


async function countProjects(platformId: PlatformId) {
    return projectRepo().countBy({
        platformId,
    })
}


async function analyzeUsers(platformId: PlatformId) {
    const oneMonthAgo = dayjs().subtract(1, 'month').toISOString()
    
    const totalUsersResult = await userRepo()
        .createQueryBuilder('usr')
        .select('COUNT(DISTINCT usr.id)', 'totalUsers')
        .where('usr.platformId = :platformId', { platformId })
        .getRawOne()

    const activeUsersResult = await auditLogRepo()
        .createQueryBuilder('ae')
        .select('COUNT(DISTINCT ae.userId)', 'activeUsers')
        .innerJoin('user', 'usr', 'usr.id = ae.userId')
        .where('ae.platformId = :platformId', { platformId })
        .andWhere('usr.platformId = :platformId', { platformId })
        .andWhere('ae.action IN (:...actions)', { 
            actions: [ApplicationEventName.USER_SIGNED_IN, ApplicationEventName.USER_SIGNED_UP],
        })
        .andWhere('ae.created > :oneMonthAgo', { oneMonthAgo })
        .getRawOne()
    
    return {
        activeUsers: parseInt(activeUsersResult.activeUsers),
        totalUsers: parseInt(totalUsersResult.totalUsers),
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

async function analyzeRuns(platformId: PlatformId): Promise<{ runsUsage: AnalyticsRunsUsageItem[], totalFlowRuns: number, totalMinutesSaved: number }> {
    const runsData = await flowRunRepo()
        .createQueryBuilder('flow_run')
        .select('DATE(flow_run.created)', 'day')
        .addSelect('COUNT(*)::int', 'totalRuns')
        .addSelect('COALESCE(SUM(COALESCE(flow."minutesSaved", flow_run."stepsCount" * 2)), 0)::int', 'minutesSaved')
        .innerJoin('project', 'project', 'flow_run."projectId" = project.id')
        .innerJoin('flow', 'flow', 'flow_run."flowId" = flow.id')
        .where('project."platformId" = :platformId', { platformId })
        .andWhere('flow_run.created >= now() - interval \'3 months\'')
        .andWhere('flow_run.environment = :environment', { environment: RunEnvironment.PRODUCTION })
        .groupBy('DATE(flow_run.created)')
        .orderBy('DATE(flow_run.created)', 'ASC')
        .getRawMany()

    let totalFlowRuns = 0
    let totalMinutesSaved = 0

    const runsUsage = runsData.map((row) => {
        const runs = parseInt(row.totalRuns)
        const minutesSaved = parseInt(row.minutesSaved)
        totalFlowRuns += runs
        totalMinutesSaved += minutesSaved
        return {
            day: row.day,
            totalRuns: runs,
            minutesSaved,
        }
    })

    return { runsUsage, totalFlowRuns, totalMinutesSaved }
}

async function analyzeFlowsDetails(platformId: PlatformId): Promise<AnalyticsFlowReportItem[]> {
    const flowData = await flowRunRepo()
        .createQueryBuilder('flow_run')
        .select('flow.id', 'flowId')
        .addSelect('latest_version."displayName"', 'flowName')
        .addSelect('project.id', 'projectId')
        .addSelect('project."displayName"', 'projectName')
        .addSelect('COUNT(*)::int', 'runs')
        .addSelect('COALESCE(SUM(COALESCE(flow."minutesSaved", flow_run."stepsCount" * 2)), 0)::int', 'minutesSaved')
        .innerJoin('project', 'project', 'flow_run."projectId" = project.id')
        .innerJoin('flow', 'flow', 'flow_run."flowId" = flow.id')
        .innerJoin('flow_version', 'latest_version', 'latest_version."flowId" = flow.id AND latest_version.id = (SELECT fv.id FROM flow_version fv WHERE fv."flowId" = flow.id ORDER BY fv.created DESC LIMIT 1)')
        .where('project."platformId" = :platformId', { platformId })
        .andWhere('flow_run.created >= now() - interval \'3 months\'')
        .andWhere('flow_run.environment = :environment', { environment: RunEnvironment.PRODUCTION })
        .groupBy('flow.id')
        .addGroupBy('latest_version."displayName"')
        .addGroupBy('project.id')
        .addGroupBy('project."displayName"')
        .orderBy('COUNT(*)', 'DESC')
        .getRawMany()

    return flowData.map((row) => ({
        flowId: row.flowId,
        flowName: row.flowName,
        projectId: row.projectId,
        projectName: row.projectName,
        runs: parseInt(row.runs),
        minutesSaved: parseInt(row.minutesSaved),
    }))
}