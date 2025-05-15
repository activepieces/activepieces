import { AnalyticsResponse, FlowRunStatus, FlowStatus, OverviewResponse } from '@activepieces/shared'
import dayjs from 'dayjs'
import { flowRepo } from '../flows/flow/flow.repo'
import { flowRunRepo } from '../flows/flow-run/flow-run-service'
import { projectService } from '../project/project-service'

type GetAnalyticsDataParams = {
    startDate: string
    endDate: string
    platformId: string
    userId: string
}

type GetOverviewParams = {
    platformId: string
    userId: string
}

export const analyticsService = {
    async getAnalyticsData(params: GetAnalyticsDataParams): Promise<AnalyticsResponse> {
        const { startDate, endDate, platformId, userId } = params
        const projectIds = await getProjectIds(platformId, userId)
        const query = flowRunRepo()
            .createQueryBuilder('flowRun')
            .where('flowRun.projectId IN (:...projectIds)') // Changed first andWhere to where
            .andWhere('"flowRun"."finishTime"::date >= :startDate::date AND "flowRun"."finishTime"::date <= :endDate::date')
            .select('flowRun.projectId', 'projectId')
            .addSelect('DATE(flowRun.finishTime)', 'date')
            .addSelect('COUNT(*)', 'totalFlowRuns')
            .addSelect(
                'SUM(CASE WHEN flowRun.status = :successStatus THEN 1 ELSE 0 END)',
                'successfulFlowRuns',
            )
            .addSelect(
                'SUM(CASE WHEN flowRun.status = :failureStatus THEN 1 ELSE 0 END)',
                'failedFlowRuns',
            )
            .addSelect(
                'SUM(CASE WHEN flowRun.status = :successStatus THEN flowRun.duration ELSE 0 END)',
                'successfulFlowRunsDuration',
            )
            .addSelect(
                'SUM(CASE WHEN flowRun.status = :failureStatus THEN flowRun.duration ELSE 0 END)',
                'failedFlowRunsDuration',
            )
            .setParameters({
                successStatus: FlowRunStatus.SUCCEEDED,
                failureStatus: FlowRunStatus.FAILED,
                projectIds,
                startDate,
                endDate,
            })
            .groupBy('flowRun.projectId, DATE(flowRun.finishTime)')
            .orderBy('date', 'ASC')


        const rawResults = await query.getRawMany()

        const results: AnalyticsResponse = rawResults.map(result => ({
            projectId: result.projectId,
            date: new Date(result.date).toISOString(),
            successfulFlowRuns: Number(result.successfulFlowRuns),
            failedFlowRuns: Number(result.failedFlowRuns),
            successfulFlowRunsDuration: Number(result.successfulFlowRunsDuration),
            failedFlowRunsDuration: Number(result.failedFlowRunsDuration),
        }))

        return results
    },
    async getOverview(params: GetOverviewParams): Promise<OverviewResponse> {
        const { start, end } = {
            start: dayjs().startOf('month').toISOString(),
            end: dayjs().endOf('month').toISOString(),
        }
        const { platformId, userId } = params
        const projectIds = await getProjectIds(platformId, userId)

        // Query 1: Get workflow counts
        const workflowResult = await flowRepo()
            .createQueryBuilder('flow')
            .select('COUNT(flow.id)', 'workflowCount')
            .addSelect(
                'SUM(CASE WHEN flow.status = :enabledStatus THEN 1 ELSE 0 END)',
                'activeWorkflowCount',
            )
            .where('flow.projectId = ANY(:projectIds)', { projectIds })
            .setParameters({ enabledStatus: FlowStatus.ENABLED, projectIds })
            .getRawOne()


        // Query 2: Get flow run counts directly
        const flowRunResult = await flowRunRepo()
            .createQueryBuilder('flowRun')
            .select('COUNT(flowRun.id)', 'flowRunCount')
            .where('flowRun.projectId = ANY(:projectIds)', { projectIds })
            .andWhere('"flowRun"."finishTime"::date BETWEEN :start::date AND :end::date')
            .setParameters({ projectIds, start, end })
            .getRawOne()

        return {
            workflowCount: Number(workflowResult.workflowCount),
            activeWorkflowCount: Number(workflowResult.activeWorkflowCount),
            flowRunCount: Number(flowRunResult.flowRunCount),
        }
    },
}

async function getProjectIds(platformId: string, userId: string): Promise<string[]> {
    const result = await projectService.getAllForUser({
        platformId,
        userId,
    })
    const projectIds = result
        .map(project => project.id)
    return projectIds
}
