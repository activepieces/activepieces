import { ApplicationEventName } from '@activepieces/ee-shared'
import { AnalyticsPieceReportItem, AnalyticsProjectReportItem, AnalyticsReportResponse, flowPieceUtil, FlowStatus, PieceCategory, PlatformId, PopulatedFlow, ProjectId } from '@activepieces/shared'
import dayjs from 'dayjs'
import { In, MoreThan } from 'typeorm'
import { auditLogRepo } from '../../ee/audit-logs/audit-event-service'
import { flowRepo } from '../../flows/flow/flow.repo'
import { flowService } from '../../flows/flow/flow.service'
import { flowRunRepo } from '../../flows/flow-run/flow-run-service'
import { pieceMetadataService } from '../../pieces/piece-metadata-service'
import { projectRepo } from '../../project/project-service'
import { userRepo } from '../../user/user-service'

export const analyticsService = {
    generateReport: async (platformId: PlatformId): Promise<AnalyticsReportResponse> => {
        const flows = await listAllFlows(platformId, undefined)
        const activeFlows = countFlows(flows, FlowStatus.ENABLED)
        const totalFlows = countFlows(flows, undefined)
        const totalProjects = await countProjects(platformId)
        const { totalUsers, activeUsers } = await analyzeUsers(platformId)
        const tasksUsage = await tasksReport(platformId)
        const { uniquePiecesUsed, topPieces } = await analyzePieces(flows, platformId)
        const activeFlowsWithAI = await numberOfFlowsWithAI(flows, platformId)
        const { topProjects, activeProjects } = await analyzeProjects(flows)
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
            tasksUsage,
            topPieces,
        }
    },
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


async function numberOfFlowsWithAI(flows: PopulatedFlow[], platformId: PlatformId) {
    const aiPiecePromises = flows.flatMap(flow => {
        const usedPieces = flowPieceUtil.getUsedPieces(flow.version.trigger)
        return usedPieces.map(piece => pieceMetadataService.getOrThrow({
            name: piece,
            version: undefined,
            projectId: flow.projectId,
            platformId,
            entityManager: undefined,
        }))
    })
    const pieceMetadataList = await Promise.all(aiPiecePromises)
    return pieceMetadataList.filter(pieceMetadata => pieceMetadata.categories?.includes(PieceCategory.ARTIFICIAL_INTELLIGENCE)).length
}

async function analyzePieces(flows: PopulatedFlow[], platformId: PlatformId) {
    const pieces: Record<string, AnalyticsPieceReportItem> = {}
    for (const flow of flows) {
        const usedPieces = flowPieceUtil.getUsedPieces(flow.version.trigger)
        for (const piece of usedPieces) {
            if (!pieces[piece]) {
                const pieceMetadata = await pieceMetadataService.getOrThrow({
                    name: piece,
                    version: undefined,
                    projectId: flow.projectId,
                    platformId,
                    entityManager: undefined,
                })
                pieces[piece] = {
                    name: piece,
                    displayName: pieceMetadata.displayName,
                    logoUrl: pieceMetadata.logoUrl,
                    usageCount: 0,
                }
            }
            pieces[piece].usageCount += 1
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
    const users = await userRepo().findBy({
        platformId,
    })
    const activeUsersPromises = users.map(async (user) => {
        const lastLoggined = await auditLogRepo().createQueryBuilder('audit_event')
            .where('audit_event."userId" = :userId', { userId: user.id })
            .andWhere({
                action: In([ApplicationEventName.USER_SIGNED_IN, ApplicationEventName.USER_SIGNED_UP]),
            })
            .andWhere({
                created: MoreThan(dayjs().subtract(1, 'month').toISOString()),
            })
            .getCount()
        return lastLoggined > 0
    })

    const activeUsersResults = await Promise.all(activeUsersPromises)
    const activeUsers = activeUsersResults.filter(Boolean).length
    return {
        activeUsers,
        totalUsers: users.length,
    }
}



async function tasksReport(platformId: PlatformId) {
    const tasks = await flowRunRepo().createQueryBuilder('flow_run')
        .innerJoin('project', 'project', 'flow_run."projectId" = project.id')
        .where('project."platformId" = :platformId', { platformId })
        .select(['DATE(flow_run.created) as day', 'SUM(COALESCE(flow_run.tasks, 0)) as total_tasks'])
        .groupBy('day')
        .getRawMany()

    return tasks.map(({ day, total_tasks }) => ({ day, totalTasks: total_tasks }))
}

async function listAllFlows(platformId: PlatformId, projectId: ProjectId | undefined): Promise<PopulatedFlow[]> {
    const queryBuilder = flowRepo().createQueryBuilder('flow')
        .select(['flow.id AS flow_id', 'flow."projectId" AS project_id'])
        .innerJoin('project', 'project', 'flow."projectId" = project.id')
        .andWhere('project."platformId" = :platformId', { platformId })
    if (projectId) {
        queryBuilder.andWhere('flow."projectId" = :projectId', { projectId })
    }
    const flowToGrab = await queryBuilder.getRawMany()
    return Promise.all(flowToGrab.map(({ flow_id, project_id }) => flowService.getOnePopulatedOrThrow({
        id: flow_id,
        projectId: project_id,
        versionId: undefined,
    })))
}

function countFlows(flows: PopulatedFlow[], status: FlowStatus | undefined) {
    if (status) {
        return flows.filter(flow => flow.status === status).length
    }
    return flows.length
}