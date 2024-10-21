import { ApplicationEventName, IssueStatus } from '@activepieces/ee-shared'
import {
    AnalyticsPieceReportItem,
    AnalyticsProjectReportItem,
    AnalyticsReportResponse,
    flowHelper,
    FlowOperationType,
    FlowStatus,
    ListPlatformProjectsLeaderboardParams,
    PieceCategory,
    PlatformId,
    PlatformProjectLeaderBoardRow,
    PopulatedFlow,
    ProjectId,
    SeekPage,
} from '@activepieces/shared'
import dayjs from 'dayjs'
import { Brackets, In, MoreThan, ObjectLiteral, SelectQueryBuilder } from 'typeorm'
import { auditLogRepo } from '../../ee/audit-logs/audit-event-service'
import { flowRepo } from '../../flows/flow/flow.repo'
import { flowService } from '../../flows/flow/flow.service'
import { flowRunRepo } from '../../flows/flow-run/flow-run-service'
import { buildPaginator } from '../../helper/pagination/build-paginator'
import { paginationHelper } from '../../helper/pagination/pagination-utils'
import { pieceMetadataService } from '../../pieces/piece-metadata-service'
import { ProjectEntity } from '../../project/project-entity'
import { projectRepo } from '../../project/project-service'
import { userRepo } from '../../user/user-service'

export const analyticsService = {
    generateReport: async (
        platformId: PlatformId,
    ): Promise<AnalyticsReportResponse> => {
        const flows = await listAllFlows(platformId, undefined)
        const enabledFlows = flows.filter(f=> f.status === FlowStatus.ENABLED)
        const totalProjects = await countProjects(platformId)
        const { totalUsers, activeUsers } = await analyzeUsers(platformId)
        const tasksUsage = await tasksReport(platformId)
        const { uniquePiecesUsed, topPieces } = await analyzePieces(enabledFlows)
        const activeFlowsWithAI = await numberOfFlowsWithAI(enabledFlows)
        const { topProjects, activeProjects } = await analyzeProjects(flows)
        return {
            totalUsers,
            activeUsers,
            activeFlows: enabledFlows.length,
            totalFlows: flows.length,
            totalProjects,
            uniquePiecesUsed,
            activeFlowsWithAI,
            topProjects,
            activeProjects,
            tasksUsage,
            topPieces,
        }
    },
    generateProjectsLeaderboard,
}

async function analyzeProjects(flows: PopulatedFlow[]) {
    const projectUsage: Record<string, AnalyticsProjectReportItem> = {}
    for (const flow of flows) {
        const projectId = flow.projectId
        const project = await projectRepo().findOneByOrFail({ id: projectId })
        if (!projectUsage[projectId]) {
            projectUsage[projectId] = {
                id: projectId,
                activeFlows: 0,
                totalFlows: 0,
                displayName: project.displayName,
            }
        }
        projectUsage[projectId].totalFlows += 1
        if (flow.status === FlowStatus.ENABLED) {
            projectUsage[projectId].activeFlows += 1
        }
    }
    return {
        topProjects: Object.values(projectUsage).map(
            ({ id, activeFlows, totalFlows, displayName }) => ({
                id,
                activeFlows,
                displayName,
                totalFlows,
            }),
        ),
        activeProjects: Object.values(projectUsage).filter(
            (project) => project.activeFlows > 0,
        ).length,
    }
}

async function numberOfFlowsWithAI(flows: PopulatedFlow[]) {
    const aiPiecePromises = flows.flatMap((flow) => {
        const usedPieces = flowHelper.getUsedPieces(flow.version.trigger)
        return usedPieces.map((piece) =>
            pieceMetadataService.getOrThrow({
                name: piece,
                version: undefined,
                projectId: flow.projectId,
                entityManager: undefined,
            }),
        )
    })
    const pieceMetadataList = await Promise.all(aiPiecePromises)
    return pieceMetadataList.filter((pieceMetadata) =>
        pieceMetadata.categories?.includes(PieceCategory.ARTIFICIAL_INTELLIGENCE),
    ).length
}

async function analyzePieces(flows: PopulatedFlow[]) {
    const pieces: Record<string, AnalyticsPieceReportItem> = {}
    for (const flow of flows) {
        const usedPieces = flowHelper.getUsedPieces(flow.version.trigger)
        for (const piece of usedPieces) {
            if (!pieces[piece]) {
                const pieceMetadata = await pieceMetadataService.getOrThrow({
                    name: piece,
                    version: undefined,
                    projectId: flow.projectId,
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
        topPieces: Object.entries(pieces)
            .sort((a, b) => b[1].usageCount - a[1].usageCount)
            .map(([_, value]) => value),
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
        const lastLoggined = await auditLogRepo()
            .createQueryBuilder('audit_event')
            .where('audit_event."userId" = :userId', { userId: user.id })
            .andWhere({
                action: In([
                    ApplicationEventName.USER_SIGNED_IN,
                    ApplicationEventName.USER_SIGNED_UP,
                ]),
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
    const tasks = await flowRunRepo()
        .createQueryBuilder('flow_run')
        .innerJoin('project', 'project', 'flow_run."projectId" = project.id')
        .where('project."platformId" = :platformId', { platformId })
        .select([
            'DATE(flow_run.created) as day',
            'SUM(COALESCE(flow_run.tasks, 0)) as total_tasks',
        ])
        .groupBy('day')
        .getRawMany()

    return tasks.map(({ day, total_tasks }) => ({
        day,
        totalTasks: total_tasks,
    }))
}

async function listAllFlows(
    platformId: PlatformId,
    projectId: ProjectId | undefined,
): Promise<PopulatedFlow[]> {
    const queryBuilder = flowRepo()
        .createQueryBuilder('flow')
        .select(['flow.id AS flow_id', 'flow."projectId" AS project_id'])
        .innerJoin('project', 'project', 'flow."projectId" = project.id')
        .andWhere('project."platformId" = :platformId', { platformId })
    if (projectId) {
        queryBuilder.andWhere('flow."projectId" = :projectId', { projectId })
    }
    const flowToGrab = await queryBuilder.getRawMany()
    return Promise.all(
        flowToGrab.map(({ flow_id, project_id }) =>
            flowService.getOnePopulatedOrThrow({
                id: flow_id,
                projectId: project_id,
                versionId: undefined,
            }),
        ),
    )
}

async function generateProjectsLeaderboard(
    params: ListPlatformProjectsLeaderboardParams,
    platformId: string,
): Promise<SeekPage<PlatformProjectLeaderBoardRow>> {
    const decodedCursor = paginationHelper.decodeCursor(params.cursor ?? null)

    const paginator = buildPaginator({
        entity: ProjectEntity,
        query: {
            limit: params.limit,
            order: 'ASC',
            afterCursor: decodedCursor.nextCursor,
            beforeCursor: decodedCursor.previousCursor,
        },
    })
   
    const queryBuilder = projectRepo()
        .createQueryBuilder('project')
        .select('"project"."displayName"', 'displayName')
        .addSelect('"project"."id"', 'id')
        .addSelect('"project"."created"', 'created')
        .where('project."platformId" = :platformId', { platformId })
      
        //Flows Created
        .leftJoin(
            (subQuery) => {
                return addDateLimitsToQuery(subQuery
                    .select('audit_event."projectId"', 'projectId')
                    .addSelect('audit_event."data"->\'flow\'->>\'id\'', 'flowId')
                    .from('audit_event', 'audit_event')
                    .where({
                        action: In([ApplicationEventName.FLOW_CREATED]),
                    })
                , params)
            },
            'flowsCreated',
            '"flowsCreated"."projectId" = project.id',
        )
        
        //Flows Deleted
        .leftJoin(
            (subQuery) => {
                return addDateLimitsToQuery(subQuery
                    .select('"audit_event"."projectId"', 'projectId')
                    .addSelect('audit_event."data"->\'flow\'->>\'id\'', 'flowId')
                    .from('audit_event', 'audit_event')
                    .where({
                        action: In([ApplicationEventName.FLOW_DELETED]),
                    })
                , params)
            },
            'flowsDeleted',
            '"flowsDeleted"."projectId" = project.id AND "flowsDeleted"."flowId" = "flowsCreated"."flowId" ',
        )
        .addSelect('COUNT(DISTINCT "flowsCreated"."flowId") FILTER (WHERE "flowsDeleted"."flowId" IS NULL)', 'flows')
        

    //Connections Created
        .leftJoin(
            (subQuery) => {
                return addDateLimitsToQuery(subQuery
                    .select('audit_event."projectId"', 'projectId')
                    .addSelect('audit_event."data"->\'connection\'->>\'id\'', 'connectionId')
                    .from('audit_event', 'audit_event')
                    .where({
                        action: In([ApplicationEventName.CONNECTION_UPSERTED]),
                    })
                , params)
            },
            'connectionsCreated',
            '"connectionsCreated"."projectId" = project.id',
        )
    // Connections Deleted
        .leftJoin(
            (subQuery) => {
                return addDateLimitsToQuery(subQuery
                    .select('"audit_event"."projectId"', 'projectId')
                    .addSelect('audit_event."data"->\'connection\'->>\'id\'', 'connectionId')
                    .from('audit_event', 'audit_event')
                    .where({
                        action: In([ApplicationEventName.CONNECTION_DELETED]),
                    })
                , params)
            },
            'connectionsDeleted',
            '"connectionsDeleted"."projectId" = project.id AND "connectionsDeleted"."connectionId" = "connectionsCreated"."connectionId" ',
        )
        .addSelect('COUNT(DISTINCT "connectionsCreated"."connectionId") FILTER (WHERE "connectionsDeleted"."connectionId" IS NULL)', 'connections')

    //Pieces Used

        .leftJoin(
            (subQuery) => {
                return addDateLimitsToQuery(subQuery
                    .select('"publishes"."projectId"', 'projectId')
                    .addSelect('"publishes"."data"->\'flowVersion\'->>\'flowId\'', 'flowId')                    
                    .addSelect('MAX(publishes.created)', 'created')
                    .from('audit_event', 'publishes')                    
                    .where(
                        new Brackets(qb => 
                            qb.where(`"publishes".action = '${ApplicationEventName.FLOW_UPDATED}'`)
                                .andWhere(`"publishes"."data"->'request'->>'type' = '${FlowOperationType.CHANGE_STATUS}'`,
                                ).andWhere(
                                    `"publishes"."data"->'request'->'request'->>'status' = '${FlowStatus.ENABLED}'`
                                    ,
                                )
                                .orWhere( `"publishes"."data"->'request'->>'type' = '${FlowOperationType.LOCK_AND_PUBLISH}'`)),
                    )
                    .andWhere(
                        `"publishes"."data"->'flowVersion'->>'flowId' NOT IN (
                            SELECT "disabled"."data"->'flowVersion'->>'flowId'
                            FROM "audit_event" AS disabled
                            WHERE disabled."projectId" = "publishes"."projectId"
                            AND disabled.action = '${ApplicationEventName.FLOW_UPDATED}'
                            AND disabled."data"->'request'->>'type' = '${FlowOperationType.CHANGE_STATUS}'
                            AND disabled."data"->'request'->'request'->>'status' = '${FlowStatus.DISABLED}'
                            AND disabled."created" > "publishes"."created"
                        )`,
                    )
                    .andWhere(
                        `"publishes"."data"->'flowVersion'->>'flowId' NOT IN (
                        SELECT "deleted"."data"->'flow'->>'id'
                        FROM "audit_event" AS deleted
                        WHERE deleted."projectId" = "publishes"."projectId"
                        AND deleted.action = '${ApplicationEventName.FLOW_DELETED}'
                        AND deleted."created" > "publishes"."created"
                    )`,
                    ), params)
                    .groupBy('publishes."projectId", "flowId"')
            },
            'activeFlows',
            '"activeFlows"."projectId" = project.id',
        )
        .addSelect('COUNT(DISTINCT "activeFlows"."flowId")', 'activeFlows')
        
      
        .leftJoin(
            (subQuery) => {
                const events = addDateLimitsToQuery(subQuery
                    .select('"publishedEvent"."projectId"', 'projectId')
                    .addSelect('"publishedEvent"."created"', 'created')
                    .addSelect(
                        'jsonb_array_elements_text("publishedEvent"."data"->\'request\'->\'request\'->\'usedPieces\')',
                        'piece',
                    )
                    .from('audit_event', 'publishedEvent')   
                    .where(`
                        "publishedEvent"."data"->'flowVersion'->>'flowId' IN ( 
                        WITH LatestActiveFlowEvents AS (
                            SELECT 
                            inner_audit_event."data" -> 'flowVersion' ->> 'flowId' AS "flowId",
                            MAX(inner_audit_event."created") AS "latest_created"
                        FROM 
                            "audit_event" AS inner_audit_event 
                        WHERE 
                            (
                                inner_audit_event.action = 'flow.updated' 
                                AND (
                                    inner_audit_event."data" -> 'request' ->> 'type' = '${FlowOperationType.CHANGE_STATUS}' 
                                    AND inner_audit_event."data" -> 'request' -> 'request' ->> 'status' = '${FlowStatus.ENABLED}'
                                ) 
                                OR inner_audit_event."data" -> 'request' ->> 'type' = '${FlowOperationType.LOCK_AND_PUBLISH}' 
                            ) 
                            AND inner_audit_event."data" -> 'flowVersion' ->> 'flowId' NOT IN (
                                SELECT 
                                    "deleted"."data" -> 'flow' ->> 'id' 
                                FROM 
                                    "audit_event" AS "deleted" 
                                WHERE 
                                    "deleted"."action" = 'flow.deleted'
                            ) 
                            AND  "inner_audit_event"."data"->'flowVersion'->>'flowId' NOT IN (
                            SELECT "disabled"."data"->'flowVersion'->>'flowId'
                            FROM "audit_event" AS disabled
                            WHERE disabled."projectId" = "inner_audit_event"."projectId"
                            AND disabled.action = '${ApplicationEventName.FLOW_UPDATED}'
                            AND disabled."data"->'request'->>'type' = '${FlowOperationType.CHANGE_STATUS}'
                            AND disabled."data"->'request'->'request'->>'status' = '${FlowStatus.DISABLED}'
                            AND disabled."created" > "inner_audit_event"."created"
                        )    
                        GROUP BY 
                            inner_audit_event."data" -> 'flowVersion' ->> 'flowId'
                    )

                    SELECT 
                        "flowId"
                    FROM 
                        LatestActiveFlowEvents)`),                
                params)
        
                return events
                    .from(`(${events.getQuery()})`, 'unnested_pieces') // Use the subquery as a derived table
                    .select('unnested_pieces."projectId"')
                    .addSelect('COUNT(DISTINCT unnested_pieces.piece)', 'piecesUsed')
                    .groupBy('unnested_pieces."projectId"')
                    .setParameters(events.getParameters())
            },
            'piecesUsed',
            '"piecesUsed"."projectId" = project.id',
        )
        .addSelect('COALESCE("piecesUsed"."piecesUsed", 0)', 'piecesUsed')

    //Users
        .leftJoin(
            (subQuery) => {
                return addDateLimitsToQuery(subQuery
                    .select('"audit_event"."projectId"', 'projectId')
                    .addSelect('COUNT(audit_event.id)', 'usersCount')
                    .from('audit_event', 'audit_event')
                    .where(`
                        audit_event.action = '${ApplicationEventName.USER_SIGNED_UP}'
                        AND audit_event."userId" NOT IN (
                        SELECT deleted_users.data->'deletedUser'->>'id' 
                        FROM  audit_event AS deleted_users
                        WHERE  deleted_users.action = '${ApplicationEventName.USER_DELETED}'
                        )
                        `)

                    .groupBy('"audit_event"."projectId"'), params)
            },
            'usersCount',
            '"usersCount"."projectId" = project.id',
        )
        .addSelect('COALESCE("usersCount"."usersCount", 0)', 'users')

    //Issues
        .leftJoin(
            (subQuery) => {
                return addDateLimitsToQuery(subQuery
                    .select('"issue"."projectId"', 'projectId')
                    .addSelect('COUNT(issue.id)', 'issuesCount')
                    .from('issue', 'issue')
                    .where(`issue.status = '${IssueStatus.ONGOING}'`)
                    .groupBy('"issue"."projectId"'), params)
            },
            'issuesCount',
            '"issuesCount"."projectId" = project.id',
        )
        .addSelect('COALESCE("issuesCount"."issuesCount", 0)', 'issues')
        
    //Runs

        .leftJoin(
            (subQuery) => {
                return addDateLimitsToQuery(subQuery
                    .select('"audit_event"."projectId"', 'projectId')
                    .addSelect('COUNT(audit_event.id)', 'runsCount')
                    .from('audit_event', 'audit_event')
                    .where({
                        action: In([ApplicationEventName.FLOW_RUN_FINISHED]),
                    })
                    .groupBy('"audit_event"."projectId"')
                , params)
            },
            'runsCount',
            '"runsCount"."projectId" = project.id',
        )
        .addSelect('COALESCE("runsCount"."runsCount", 0)', 'runs')

    //Tasks

        .leftJoin(
            (subQuery) => {
                return addDateLimitsToQuery(subQuery
                    .select('"audit_event"."projectId"', 'projectId')
                    .addSelect(
                        'SUM(CAST("audit_event"."data"->\'flowRun\'->>\'tasks\' AS INTEGER))',
                        'tasks',
                    )
                    .from('audit_event', 'audit_event')
                    .where({
                        action: In([ApplicationEventName.FLOW_RUN_FINISHED]),
                    })
                    .groupBy('"audit_event"."projectId"'), params)
            },
            'tasks',
            '"tasks"."projectId" = project.id',
        )
        .addSelect(
            'COALESCE("tasks"."tasks", 0)',
            'tasks',
        )
  

    //Flows Edited
        .leftJoin(
            (subQuery) => {
                return addDateLimitsToQuery(subQuery
                    .select('"audit_event"."projectId"', 'projectId')
                    .addSelect('COUNT(audit_event.id)', 'contributions')
                    .from('audit_event', 'audit_event')
                    .where({
                        action: In([ApplicationEventName.FLOW_UPDATED]),
                    })
                    .andWhere(
                        '"audit_event"."data"->\'request\'->>\'type\' NOT IN (:...excludedTypes)',
                        {
                            excludedTypes: [
                                FlowOperationType.LOCK_AND_PUBLISH,
                                FlowOperationType.LOCK_FLOW,
                            ],
                        },
                    )
                    .groupBy('"audit_event"."projectId"'), params)
            },
            'contributions',
            '"contributions"."projectId" = project.id',
        )
        .addSelect('COALESCE("contributions"."contributions", 0)', 'contributions')
        .groupBy(`
            project.id,
            project."displayName",
            tasks,
            runs,
            users,
            issues,
            contributions,
            "piecesUsed"
            `)
      
  


 
    const { data, cursor } = await paginator.paginateRaw<PlatformProjectLeaderBoardRow>(queryBuilder, {
        orderBy: params.orderByColumn ? `"${params.orderByColumn}" ` : 'contributions',
        order: params.order ?? 'DESC',
    })
    return paginationHelper.createPage<PlatformProjectLeaderBoardRow>(data, cursor)
}



const addDateLimitsToQuery = (query: SelectQueryBuilder<ObjectLiteral>, params: ListPlatformProjectsLeaderboardParams)=>{

    if (params.createdAfter) {
        query = query.andWhere('created >= :from', { from: params.createdAfter })
    }

    if (params.createdBefore) {
        query = query.andWhere('created <= :to', { to: params.createdBefore })
    }
    return query
}

