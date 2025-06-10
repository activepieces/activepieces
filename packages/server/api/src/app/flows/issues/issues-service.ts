import { rejectedPromiseHandler } from '@activepieces/server-shared'
import { ActionType, ActivepiecesError, apId, ApId, assertNotNullOrUndefined, ErrorCode, ExecutioOutputFile, FileType, FlowRun, FlowRunStatus, flowStructureUtil, isNil, Issue, IssueStatus, ListIssuesParams, LoopStepOutput, PopulatedIssue, SeekPage, spreadIfDefined, StepOutput, StepOutputStatus, TelemetryEventName } from '@activepieces/shared'
import dayjs from 'dayjs'
import { FastifyBaseLogger } from 'fastify'
import { LessThan } from 'typeorm'
import { repoFactory } from '../../core/db/repo-factory'
import { fileService } from '../../file/file.service'
import { buildPaginator } from '../../helper/pagination/build-paginator'
import { paginationHelper } from '../../helper/pagination/pagination-utils'
import { telemetry } from '../../helper/telemetry.utils'
import { flowVersionService } from '../flow-version/flow-version.service'
import { IssueEntity } from './issues-entity'

const repo = repoFactory(IssueEntity)


export const issuesService = (log: FastifyBaseLogger) => ({
    async add(flowRun: FlowRun): Promise<Issue> {
        const date = dayjs(flowRun.created).toISOString()
        const failedStepId = await extractFailedStepId(flowRun, log)

        // First try to find an existing issue for this step
        const existingIssue = await repo().findOne({
            where: {
                projectId: flowRun.projectId,
                flowId: flowRun.flowId,
                stepId: failedStepId,
                status: IssueStatus.UNRESOLVED,
            },
        })

        if (existingIssue) {
            return this.update({
                projectId: flowRun.projectId,
                flowId: flowRun.flowId,
                status: IssueStatus.UNRESOLVED,
            })
        }

        // If no existing issue, create a new one
        const issueId = apId()
        await repo().createQueryBuilder()
            .insert()
            .into(IssueEntity)
            .values({
                projectId: flowRun.projectId,
                flowId: flowRun.flowId,
                id: issueId,
                lastOccurrence: date,
                stepId: failedStepId,
                status: IssueStatus.UNRESOLVED,
                created: date,
                updated: date,
            })
            .execute()

        const issue = await repo().findOneByOrFail({ id: issueId })
        issue.step = await getStepFromFlow(flowRun.flowId, failedStepId, log)
        return issue
    },
    async get({ projectId, flowId, stepId }: { projectId: string, flowId: string, stepId: string }): Promise<Issue | null> {
        const issue = await repo().findOneByOrFail({
            projectId,
            flowId,
            stepId,
            status: IssueStatus.UNRESOLVED,
        })

        issue.step = await getStepFromFlow(issue.flowId, stepId, log)
        return issue
    },
    async list({ projectId, cursor, limit }: ListIssuesParams): Promise<SeekPage<PopulatedIssue>> {
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

        const query = repo().createQueryBuilder(IssueEntity.options.name)
            .where({
                projectId,
                status: IssueStatus.UNRESOLVED,
            })

        const { data, cursor: newCursor } = await paginator.paginate(query)

        const populatedIssues = await Promise.all(data.map(async issue => {
            // Get flow runs count for this issue
            const count = await repo().createQueryBuilder()
                .select('COUNT(*)', 'count')
                .from('flow_run', 'fr')
                .where('fr."flowId" = :flowId', { flowId: issue.flowId })
                .andWhere('fr.status = :status', { status: FlowRunStatus.FAILED })
                .getRawOne()
                .then(result => parseInt(result.count, 10))

            const flowVersion = await flowVersionService(log).getLatestLockedVersionOrThrow(issue.flowId)
            if (!isNil(issue.stepId)) {
                issue.step = await getStepFromFlow(issue.flowId, issue.stepId ?? '', log) 
            }
            return {
                ...issue,
                flowDisplayName: flowVersion.displayName,
                count,
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
        if (!isNil(issue.stepId)) {
            issue.step = await getStepFromFlow(issue.flowId, issue.stepId, log)
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

const extractFailedStepId = async (flowRun: FlowRun, log: FastifyBaseLogger) => {
    const flowSteps = await fileService(log).getDataOrThrow({
        projectId: flowRun.projectId, 
        fileId: flowRun.logsFileId ?? '', 
        type: FileType.FLOW_RUN_LOG,
    })
    const rawData = Buffer.from(flowSteps.data).toString('utf-8')
    const executionOutput = JSON.parse(rawData) as ExecutioOutputFile
    const executionState = executionOutput.executionState

    const failedStep = Object.entries(executionState.steps).find(([_, step]) => {
        const stepOutput = step as StepOutput
        if (stepOutput.type === ActionType.LOOP_ON_ITEMS) {
            const loopOutput = stepOutput as LoopStepOutput
            return loopOutput.output?.iterations.some(iteration => 
                Object.values(iteration).some(step => step.status === StepOutputStatus.FAILED),
            )
        }
        return stepOutput.status === StepOutputStatus.FAILED
    })

    assertNotNullOrUndefined(failedStep, 'failedStep')
    return failedStep[0]
}

const getStepFromFlow = async (flowId: string, stepId: string, log: FastifyBaseLogger) => {
    const flowVersion = await flowVersionService(log).getLatestLockedVersionOrThrow(flowId)
    const allSteps = flowStructureUtil.getAllSteps(flowVersion.trigger)
    const step = allSteps.find(s => s.name === stepId)
    
    assertNotNullOrUndefined(step, 'step')

    return {
        stepId: step.name,
        name: step.displayName,
        type: step.type,
    }
}