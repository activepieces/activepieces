import { rejectedPromiseHandler } from '@activepieces/server-shared'
import { ActivepiecesError, apId, ApId, assertNotNullOrUndefined, ErrorCode, FlowRun, FlowRunStatus, flowStructureUtil, isNil, Issue, IssueStatus, ListIssuesParams, PopulatedIssue, SeekPage, spreadIfDefined, TelemetryEventName } from '@activepieces/shared'
import dayjs from 'dayjs'
import { FastifyBaseLogger } from 'fastify'
import { In, LessThan } from 'typeorm'
import { repoFactory } from '../../core/db/repo-factory'
import { buildPaginator } from '../../helper/pagination/build-paginator'
import { paginationHelper } from '../../helper/pagination/pagination-utils'
import { telemetry } from '../../helper/telemetry.utils'
import { flowRunRepo } from '../flow-run/flow-run-service'
import { flowVersionService } from '../flow-version/flow-version.service'
import { IssueEntity } from './issues-entity'

const repo = repoFactory(IssueEntity)

const FAILED_STATES = [FlowRunStatus.FAILED, FlowRunStatus.INTERNAL_ERROR, FlowRunStatus.TIMEOUT]


export const issuesService = (log: FastifyBaseLogger) => ({
    async add(flowRun: FlowRun): Promise<Issue> {
        const date = dayjs(flowRun.created).toISOString()
        assertNotNullOrUndefined(flowRun.failedStepName, 'failedStepName')
        const issueId = apId()
        
        const insertQuery = repo().createQueryBuilder()
            .insert()
            .into(IssueEntity)
            .values({
                projectId: flowRun.projectId,
                flowId: flowRun.flowId,
                id: issueId,
                lastOccurrence: date,
                stepName: flowRun.failedStepName,
                status: IssueStatus.UNRESOLVED,
                created: date,
                updated: date,
            })
            .orUpdate(
                ['lastOccurrence', 'updated', 'status', 'projectId'],
                ['flowId', 'stepName'],
                {
                    skipUpdateIfNoValuesChanged: true,
                },
            )
        
        await insertQuery.execute()

        const issue = await repo().findOneByOrFail({
            projectId: flowRun.projectId,
            flowId: flowRun.flowId,
            stepName: flowRun.failedStepName,
            status: IssueStatus.UNRESOLVED,
        })
        
        return enrichIssue(issue, log)
    },
    async get({ projectId, flowId, stepName }: { projectId: string, flowId: string, stepName: string }): Promise<Issue | null> {
        const issue = await repo().findOneByOrFail({
            projectId,
            flowId,
            stepName,
            status: IssueStatus.UNRESOLVED,
        })

        return enrichIssue(issue, log)
    },
    async list({ projectId, cursor, limit, status }: ListIssuesParams ): Promise<SeekPage<PopulatedIssue>> {
        await resolveIssueWithZeroCount(log)

        const decodedCursor = paginationHelper.decodeCursor(cursor ?? null)
        const paginator = buildPaginator({
            entity: IssueEntity,
            query: {
                limit,
                order: 'ASC',
                afterCursor: decodedCursor.nextCursor,
                beforeCursor: decodedCursor.previousCursor,
            },
        })

        let query = repo().createQueryBuilder(IssueEntity.options.name)
            .where({ projectId })

        if (!isNil(status) && status.length > 0) {
            query = query.andWhere('status IN (:...statuses)', { statuses: status })
        }

        const { data, cursor: newCursor } = await paginator.paginate(query)
        const populatedIssues = await Promise.all(data.map(issue => enrichIssue(issue, log)))
        return paginationHelper.createPage<PopulatedIssue>(populatedIssues, newCursor)
    },

    async updateById({ projectId, id, status }: UpdateParams): Promise<void> {
        const flowIssue = await repo().findOneBy({
            id,
            projectId,
        })
        if (isNil(flowIssue)) {
            throw new ActivepiecesError({
                code: ErrorCode.ENTITY_NOT_FOUND,
                params: {
                    message: 'issue not found',
                },
            })
        }
        rejectedPromiseHandler(telemetry(log).trackProject(flowIssue.projectId, {
            name: TelemetryEventName.FLOW_ISSUE_RESOLVED,
            payload: {
                flowId: flowIssue.flowId,
            },
        }), log)
        await repo().update({
            id,
        }, {
            status,
            updated: new Date().toISOString(),
        })
    },
    async update({ projectId, flowId, status }: {
        projectId: ApId
        flowId: ApId
        status: IssueStatus
    }): Promise<Issue> {
        await repo().update({
            projectId,
            flowId,
        }, {
            ...spreadIfDefined('lastOccurrence', status !== IssueStatus.RESOLVED ? dayjs().toISOString() : undefined),
            status,
            updated: new Date().toISOString(),
        })
        const issue = await repo().findOneByOrFail({
            projectId,
            flowId,
        })

        return enrichIssue(issue, log)
    },
    async count({ projectId }: { projectId: ApId }): Promise<number> {
        return repo().count({
            where: {
                projectId,
                status: IssueStatus.UNRESOLVED,
            },
        })
    },
    async archiveOldIssues(olderThanDays: number): Promise<void> {
        const cutoffDate = dayjs().subtract(olderThanDays, 'days').toISOString()
        
        const result = await repo().update({
            status: IssueStatus.UNRESOLVED,
            updated: LessThan(cutoffDate),
        }, {
            status: IssueStatus.ARCHIVED,
            updated: new Date().toISOString(),
        })

        log.info({
            archivedCount: result.affected,
            olderThanDays,
            cutoffDate,
        }, 'Archived old issues')
    },
})

type UpdateParams = {
    projectId: string
    id: string
    status: IssueStatus
}

const getStepFromFlow = async (flowId: string, stepName: string, log: FastifyBaseLogger) => {
    const flowVersion = await flowVersionService(log).getLatestLockedVersionOrThrow(flowId)
    const allSteps = flowStructureUtil.getAllSteps(flowVersion.trigger)
    const step = allSteps.find(s => s.name === stepName)
    
    assertNotNullOrUndefined(step, 'step')

    return {
        stepName: step.name,
        name: step.displayName,
        type: step.type,
    }
}

async function resolveIssueWithZeroCount(log: FastifyBaseLogger) {
    await repo().createQueryBuilder('issue')
        .update(IssueEntity)
        .set({
            status: IssueStatus.RESOLVED,
            updated: new Date().toISOString(),
        })
        .where('status = :status', { status: IssueStatus.UNRESOLVED })
        .andWhere(_issue => { 
            const subQuery = flowRunRepo() 
                .createQueryBuilder('flowRun') 
                .select('"flowRun".id') 
                .where('"flowRun"."flowId" = issue."flowId"') 
                .andWhere('"flowRun"."failedStepName" = issue."stepName"') 
                .andWhere(`"flowRun".status IN ('${FAILED_STATES.join('\', \'')}')`) 
                .getQuery() 
            return `NOT EXISTS (${subQuery})` 
        })
        .execute()

    log.info('Resolved issues with zero failed runs')
}

async function enrichIssue(issue: Issue, log: FastifyBaseLogger) {
    const flowVersion = await flowVersionService(log).getLatestLockedVersionOrThrow(issue.flowId)
    const count = await flowRunRepo().countBy({
        flowId: issue.flowId,
        failedStepName: issue.stepName,
        status: In(FAILED_STATES),
    })
    return {
        ...issue,
        step: isNil(issue.stepName) ? undefined : await getStepFromFlow(issue.flowId, issue.stepName, log),
        flowDisplayName: flowVersion.displayName ?? '',
        count,
    }
}
