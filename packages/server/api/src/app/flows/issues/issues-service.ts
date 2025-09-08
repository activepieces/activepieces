import { AppSystemProp, rejectedPromiseHandler } from '@activepieces/server-shared'
import { ActivepiecesError, apId, ApId, assertNotNullOrUndefined, ErrorCode, FAILED_STATES, FlowRun, FlowRunStatus, flowStructureUtil, FlowVersion, isNil, Issue, IssueStatus, ListIssuesParams, PopulatedIssue, SeekPage, spreadIfDefined, TelemetryEventName } from '@activepieces/shared'
import dayjs from 'dayjs'
import { FastifyBaseLogger } from 'fastify'
import { In, LessThan } from 'typeorm'
import { repoFactory } from '../../core/db/repo-factory'
import { buildPaginator } from '../../helper/pagination/build-paginator'
import { paginationHelper } from '../../helper/pagination/pagination-utils'
import { system } from '../../helper/system/system'
import { telemetry } from '../../helper/telemetry.utils'
import { FlowRunEntity } from '../flow-run/flow-run-entity'
import { flowRunRepo } from '../flow-run/flow-run-service'
import { flowVersionService } from '../flow-version/flow-version.service'
import { IssueEntity } from './issues-entity'

const repo = repoFactory(IssueEntity)
const archiveDays = system.getNumberOrThrow(AppSystemProp.ISSUE_ARCHIVE_DAYS)

export const issuesService = (log: FastifyBaseLogger) => ({
    async add(flowRun: FlowRun): Promise<PopulatedIssue> {
        const date = dayjs(flowRun.created).toISOString()
        const issueId = apId()

        await repo().createQueryBuilder()
            .insert()
            .into(IssueEntity)
            .values({
                projectId: flowRun.projectId,
                flowId: flowRun.flowId,
                flowVersionId: flowRun.flowVersionId,
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
            ).execute()

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
    async list({ projectId, cursor, limit, status }: ListIssuesParams): Promise<SeekPage<PopulatedIssue>> {
        await resolveIssueWithZeroCount(projectId, log)

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
            query = query.andWhere({
                status: In(status),
            })
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
})

type UpdateParams = {
    projectId: string
    id: string
    status: IssueStatus
}


async function resolveIssueWithZeroCount(projectId: string, log: FastifyBaseLogger) {
    await repo().createQueryBuilder('issue')
        .update(IssueEntity)
        .set({
            status: IssueStatus.RESOLVED,
            updated: new Date().toISOString(),
        })
        .where({
            status: IssueStatus.UNRESOLVED,
            projectId,
        })
        .andWhere(qb => {
            const subQuery = qb.createQueryBuilder()
                .select('1')
                .from(FlowRunEntity, 'flow_run')
                .where('flow_run."flowId" = issue."flowId"')
                .andWhere('flow_run."failedStepName" = issue."stepName"')
                .andWhere('flow_run.status IN (:...statuses)')
                .getQuery()
            return `NOT EXISTS (${subQuery})`
        }, { statuses: FAILED_STATES })
        .execute()


    const cutoffDate = dayjs().subtract(archiveDays, 'days').toISOString()
    await repo().update({
        projectId,
        status: IssueStatus.UNRESOLVED,
        updated: LessThan(cutoffDate),
    }, {
        status: IssueStatus.ARCHIVED,
        updated: new Date().toISOString(),
    })
    log.info('Resolved issues with zero failed runs')
}

async function enrichIssue(issue: Issue, log: FastifyBaseLogger) {
    const flowVersion = await flowVersionService(log).getOneOrThrow(issue.flowVersionId)
    const count = await flowRunRepo().countBy({
        flowId: issue.flowId,
        flowVersionId: issue.flowVersionId,
        failedStepName: issue.stepName,
        status: In([FlowRunStatus.FAILED, FlowRunStatus.INTERNAL_ERROR, FlowRunStatus.TIMEOUT]),
    })
    return {
        ...issue,
        step: isNil(issue.stepName) ? undefined : getStepFromFlow(flowVersion, issue.stepName),
        flowDisplayName: flowVersion.displayName ?? '',
        count,
    }
}

function getStepFromFlow(flowVersion: FlowVersion, stepName: string) {
    const allSteps = flowStructureUtil.getAllSteps(flowVersion.trigger)
    const step = allSteps.find(s => s.name === stepName)

    assertNotNullOrUndefined(step, 'step')

    return {
        stepName: step.name,
        name: step.displayName,
        type: step.type,
    }
}