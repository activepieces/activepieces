import { ApplicationEventName } from '@activepieces/ee-shared'
import { PieceMetadataModel } from '@activepieces/pieces-framework'
import { AnalyticsPieceReportItem, AnalyticsProjectReportItem, AnalyticsRunsUsageItem, apId, assertNotNullOrUndefined, flowPieceUtil, FlowStatus, FlowVersionState, isNil, PieceCategory, PlatformAnalyticsReport, PlatformId, PopulatedFlow, RunEnvironment } from '@activepieces/shared'
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
    const { uniquePiecesUsed, topPieces } = analyzePieces(flows, pieceMetadataMap)
    const activeFlowsWithAI = numberOfFlowsWithAI(flows, pieceMetadataMap)

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

function analyzePieces(flows: PopulatedFlow[], pieceMetadataMap: Map<string, PieceMetadataModel>) {
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

async function analyzeRuns(platformId: PlatformId): Promise<AnalyticsRunsUsageItem[]> {
    const runsData = await flowRunRepo()
        .createQueryBuilder('flow_run')
        .select('DATE(flow_run.created)', 'day')
        .addSelect('COUNT(*)', 'totalRuns')
        .innerJoin('project', 'project', 'flow_run."projectId" = project.id')
        .where('project."platformId" = :platformId', { platformId })
        .andWhere('flow_run.created >= now() - interval \'3 months\'')
        .andWhere('flow_run.environment = :environment', { environment: RunEnvironment.PRODUCTION })
        .groupBy('DATE(flow_run.created)')
        .orderBy('DATE(flow_run.created)', 'ASC')
        .getRawMany()

    return runsData.map((row) => ({
        day: row.day,
        totalRuns: row.totalRuns,
    }))
}