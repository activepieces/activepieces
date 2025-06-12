import { rejectedPromiseHandler } from '@activepieces/server-shared'
import { ActivepiecesError, apId, ApId, assertNotNullOrUndefined, ErrorCode, FlowRun, FlowRunStatus, flowStructureUtil, isNil, Issue, IssueStatus, ListIssuesParams, PopulatedIssue, SeekPage, spreadIfDefined, TelemetryEventName } from '@activepieces/shared'
import dayjs from 'dayjs'
import { FastifyBaseLogger } from 'fastify'
import { LessThan } from 'typeorm'
import { repoFactory } from '../../core/db/repo-factory'
import { buildPaginator } from '../../helper/pagination/build-paginator'
import { paginationHelper } from '../../helper/pagination/pagination-utils'
import { telemetry } from '../../helper/telemetry.utils'
import { flowVersionService } from '../flow-version/flow-version.service'
import { IssueEntity } from './issues-entity'

const repo = repoFactory(IssueEntity)


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
                count: 0,
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
        
        issue.step = await getStepFromFlow(flowRun.flowId, flowRun.failedStepName, log)
        
        return issue
    },
    async get({ projectId, flowId, stepName }: { projectId: string, flowId: string, stepName: string }): Promise<Issue | null> {
        const issue = await repo().findOneByOrFail({
            projectId,
            flowId,
            stepName,
            status: IssueStatus.UNRESOLVED,
        })

        issue.step = await getStepFromFlow(issue.flowId, stepName, log)
        return issue
    },
    async list({ projectId, cursor, limit, status }: ListIssuesParams ): Promise<SeekPage<PopulatedIssue>> {
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

        if (status && status.length > 0) {
            query = query.andWhere('status IN (:...statuses)', { statuses: status })
        }

        const { data, cursor: newCursor } = await paginator.paginate(query)

        const issuesWithCounts = await Promise.all(data.map(async issue => {
            // Fixed query with proper join between issue and flow_run
            const count = await repo()
                .createQueryBuilder('i') 
                .select('COUNT(*)', 'count')
                .innerJoin('flow_run', 'fr', 'i."flowId" = fr."flowId" AND i."stepName" = fr."failedStepName"')
                .where('fr."flowId" = :flowId', { flowId: issue.flowId })
                .andWhere('fr.status IN (:...statuses)', { statuses: [FlowRunStatus.FAILED, FlowRunStatus.INTERNAL_ERROR, FlowRunStatus.TIMEOUT] })
                .andWhere('fr."failedStepName" = :stepName', { stepName: issue.stepName })
                .andWhere('i.id = :issueId', { issueId: issue.id })
                .getRawOne()
                .then(result => parseInt(result.count, 10))

            if (count === 0 && issue.status === IssueStatus.UNRESOLVED) {
                await this.updateById({
                    projectId: issue.projectId,
                    id: issue.id,
                    status: IssueStatus.RESOLVED,
                })
                issue.status = IssueStatus.RESOLVED
            }

            const actualStatus = issue.status === IssueStatus.ARCHIVED 
                ? IssueStatus.ARCHIVED 
                : (count === 0 ? IssueStatus.RESOLVED : issue.status)

            return {
                issue,
                count,
                actualStatus,
            }
        }))

        // Filter issues based on the actual calculated status
        const filteredIssues = issuesWithCounts.filter(({ actualStatus }) => {
            if (!status || status.length === 0) {
                return true
            }
            
            return status.includes(actualStatus)
        })

        const populatedIssues = await Promise.all(filteredIssues.map(async ({ issue, count, actualStatus }) => {
            const flowVersion = await flowVersionService(log).getLatestLockedVersionOrThrow(issue.flowId)
            if (!isNil(issue.stepName)) {
                issue.step = await getStepFromFlow(issue.flowId, issue.stepName ?? '', log) 
            }
            
            return {
                ...issue,
                flowDisplayName: flowVersion.displayName,
                count,
                status: actualStatus,
            }
        }))

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
        if (!isNil(issue.stepName)) {
            issue.step = await getStepFromFlow(issue.flowId, issue.stepName, log)
        }

        return issue
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