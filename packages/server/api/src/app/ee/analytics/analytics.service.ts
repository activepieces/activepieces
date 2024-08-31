import { AnalyticsReportResponse, flowHelper, FlowStatus, PieceCategory, PlatformId, PopulatedFlow, ProjectId } from '@activepieces/shared'
import { flowRepo } from '../../flows/flow/flow.repo'
import { flowService } from '../../flows/flow/flow.service'
import { flowRunRepo } from '../../flows/flow-run/flow-run-service'
import { pieceMetadataService } from '../../pieces/piece-metadata-service'
import { projectRepo } from '../../project/project-service'
import { userRepo } from '../../user/user-service'

export const analyticsService = {
    generateReport: async (platformId: PlatformId, projectId?: ProjectId): Promise<AnalyticsReportResponse> => {
        const flows = await listAllFlows(platformId, projectId)
        const activeFlows = countFlows(flows, FlowStatus.ENABLED)
        const totalFlows = countFlows(flows, undefined)
        const totalProjects = await countProjects(platformId)
        const totalUsers = await countUsers(platformId)
        const tasksUsage = await tasksReport(platformId)
        const { uniquePiecesUsed, topPieces } = analyzePieces(flows)
        const activeFlowsWithAI = await numberOfFlowsWithAI(flows)
        const { topProjects, activeProjects } = await analyzeProjects(flows)
        return {
            totalUsers,
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
    const projectUsage: Record<string, { activeFlows: number, totalFlows: number }> = {}
    let activeProjects = 0

    for (const flow of flows) {
        const projectId = flow.projectId
        if (!projectUsage[projectId]) {
            projectUsage[projectId] = { activeFlows: 0, totalFlows: 0 }
        }
        projectUsage[projectId].totalFlows += 1
        if (flow.status === FlowStatus.ENABLED) {
            projectUsage[projectId].activeFlows += 1
        }
    }

    activeProjects = Object.values(projectUsage).filter(project => project.activeFlows > 0).length

    const topProjects = Object.entries(projectUsage).map(([name, { activeFlows, totalFlows }]) => ({
        name,
        activeFlows,
        totalFlows,
    }))

    return { topProjects, activeProjects }
}


async function numberOfFlowsWithAI(flows: PopulatedFlow[]) {
    const aiPiecePromises = flows.flatMap(flow => {
        const usedPieces = flowHelper.getUsedPieces(flow.version.trigger)
        return usedPieces.map(piece => pieceMetadataService.getOrThrow({
            name: piece,
            version: undefined,
            projectId: flow.projectId,
            entityManager: undefined,
        }))
    })
    const pieceMetadataList = await Promise.all(aiPiecePromises)
    return pieceMetadataList.filter(pieceMetadata => pieceMetadata.categories?.includes(PieceCategory.ARTIFICIAL_INTELLIGENCE)).length
}

function analyzePieces(flows: PopulatedFlow[]) {
    const pieces: Record<string, number> = {}
    for (const flow of flows) {
        const usedPieces = flowHelper.getUsedPieces(flow.version.trigger)
        for (const piece of usedPieces) {
            pieces[piece] = (pieces[piece] || 0) + 1
        }
    }
    return {
        uniquePiecesUsed: Object.keys(pieces).length,
        topPieces: Object.entries(pieces).sort((a, b) => b[1] - a[1]).map(([name, count]) => ({ name, usageCount: count })),
    }
}


async function countProjects(platformId: PlatformId) {
    return projectRepo().countBy({
        platformId,
    })
}


async function countUsers(platformId: PlatformId) {
    return userRepo().countBy({
        platformId,
    })
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