import { ApplicationEventName } from '@activepieces/ee-shared'
import { AnalyticsPieceReportItem, AnalyticsProjectReportItem, AnalyticsReportResponse, flowPieceUtil, FlowStatus, PieceCategory, PlatformId, PopulatedFlow, ProjectId } from '@activepieces/shared'
import dayjs from 'dayjs'
import { FastifyBaseLogger } from 'fastify'
import { In, MoreThan } from 'typeorm'
import { auditLogRepo } from '../../ee/audit-logs/audit-event-service'
import { flowRepo } from '../../flows/flow/flow.repo'
import { flowRunRepo } from '../../flows/flow-run/flow-run-service'
import { flowVersionService } from '../../flows/flow-version/flow-version.service'
import { pieceMetadataService } from '../../pieces/piece-metadata-service'
import { projectRepo } from '../../project/project-service'
import { userRepo } from '../../user/user-service'

export const analyticsService = (log: FastifyBaseLogger) => ({
    generateReport: async (platformId: PlatformId): Promise<AnalyticsReportResponse> => {
        const start = performance.now()
        const flows = await listAllFlows(log, platformId, undefined)
        log.info(`listAllFlows took ${performance.now() - start}ms`)
        const start2 = performance.now()
        const activeFlows = countFlows(flows, FlowStatus.ENABLED)
        log.info(`countFlows took ${performance.now() - start2}ms`)
        const start3 = performance.now()
        const totalFlows = countFlows(flows, undefined)
        log.info(`countFlows took ${performance.now() - start3}ms`)
        const start4 = performance.now()
        const totalProjects = await countProjects(platformId)
        log.info(`countProjects took ${performance.now() - start4}ms`)
        const start5 = performance.now()
        const { totalUsers, activeUsers } = await analyzeUsers(platformId)
        log.info(`analyzeUsers took ${performance.now() - start5}ms`)
        const start6 = performance.now()
        const tasksUsage = await tasksReport(platformId)
        log.info(`tasksReport took ${performance.now() - start6}ms`)
        const start7 = performance.now()
        const { uniquePiecesUsed, topPieces } = await analyzePieces(log, flows, platformId)
        log.info(`analyzePieces took ${performance.now() - start7}ms`)
        const start8 = performance.now()
        const activeFlowsWithAI = await numberOfFlowsWithAI(log, flows, platformId)
        log.info(`numberOfFlowsWithAI took ${performance.now() - start8}ms`)
        const start9 = performance.now()
        const { topProjects, activeProjects } = await analyzeProjects(flows)
        log.info(`analyzeProjects took ${performance.now() - start9}ms`)
        log.info(`total time took ${performance.now() - start}ms`)
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
})


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
        return usedPieces.map(piece => pieceMetadataService(log).getOrThrow({
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

async function analyzePieces(log: FastifyBaseLogger, flows: PopulatedFlow[], platformId: PlatformId) {
    const pieces: Record<string, AnalyticsPieceReportItem> = {}
    for (const flow of flows) {
        const usedPieces = flowPieceUtil.getUsedPieces(flow.version.trigger)
        for (const piece of usedPieces) {
            if (!pieces[piece]) {
                const pieceMetadata = await pieceMetadataService(log).getOrThrow({
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

async function listAllFlows(log: FastifyBaseLogger, platformId: PlatformId, projectId: ProjectId | undefined): Promise<PopulatedFlow[]> {
    const queryBuilder = flowRepo().createQueryBuilder('flow')
        .addCommonTableExpression(
            `
            SELECT DISTINCT ON ("flowId") *
            FROM flow_version
            ORDER BY "flowId", created DESC
            `,
            'latest_versions',
        )
        .leftJoin('latest_versions', 'latest_version', 'latest_version."flowId" = flow.id')
        .innerJoin('project', 'project', 'flow."projectId" = project.id')
        .select([
            'flow.id as flow_id',
            'flow.projectId as flow_projectId',
            'flow.folderId as flow_folderId', 
            'flow.status as flow_status',
            'flow.created as flow_created',
            'flow.updated as flow_updated',
            'flow.handshakeConfiguration as flow_handshakeConfiguration',
            'flow.schedule as flow_schedule',
            'flow.externalId as flow_externalId',
            'flow.publishedVersionId as flow_publishedVersionId',
            'flow.metadata as flow_metadata',
            'latest_version.id as version_id',
            'latest_version."displayName" as version_displayName',
            'latest_version."schemaVersion" as version_schemaVersion',
            'latest_version.trigger as version_trigger',
            'latest_version."connectionIds" as version_connectionIds',
            'latest_version."updatedBy" as version_updatedBy',
            'latest_version.valid as version_valid',
            'latest_version.state as version_state',
            'latest_version.created as version_created',
            'latest_version.updated as version_updated',
        ])
        .andWhere('project."platformId" = :platformId', { platformId })

    if (projectId) {
        queryBuilder.andWhere('flow."projectId" = :projectId', { projectId })
    }

    const results = await queryBuilder.getRawMany()
    
    return results.map(row => ({
        id: row.flow_id,
        projectId: row.flow_projectId,
        folderId: row.flow_folderId,
        status: row.flow_status,
        created: row.flow_created,
        updated: row.flow_updated,
        handshakeConfiguration: row.flow_handshakeConfiguration,
        schedule: row.flow_schedule,
        externalId: row.flow_externalId,
        publishedVersionId: row.flow_publishedVersionId,
        metadata: row.flow_metadata,
        version: flowVersionService(log).removeSecretsFromFlow({
            id: row.version_id,
            flowId: row.flow_id,
            displayName: row.version_displayName,
            schemaVersion: row.version_schemaVersion,
            trigger: row.version_trigger,
            connectionIds: row.version_connectionIds,
            updatedBy: row.version_updatedBy,
            valid: row.version_valid,
            state: row.version_state,
            created: row.version_created,
            updated: row.version_updated,
        }, false, false),
    }))
}

function countFlows(flows: PopulatedFlow[], status: FlowStatus | undefined) {
    if (status) {
        return flows.filter(flow => flow.status === status).length
    }
    return flows.length
}