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
        // Removed unused variable projectIds
        const query = flowRunRepo()
            .createQueryBuilder('flowRun')
            .andWhere('flowRun.projectId IN (:...projectIds)')
            .andWhere('DATE(flowRun.finishTime) BETWEEN :start AND :end', {
                start: startDate,
                end: endDate,
            })
            .addSelect('flowRun.projectId', 'projectId')
            .addSelect('DATE(flowRun.finishTime)', 'date')
            .addSelect('COUNT(*)', 'totalFlowRuns')
            .addSelect(
                'SUM(CASE WHEN flowRun.status = :successStatus THEN 1 END)',
                'successfulFlowRuns',
            )
            .addSelect(
                'SUM(CASE WHEN flowRun.status = :failureStatus THEN 1 END)',
                'failedFlowRuns',
            )
            .addSelect(
                'SUM(CASE WHEN flowRun.status = :successStatus THEN flowRun.duration END)',
                'successfulFlowRunsDuration',
            )
            .addSelect(
                'SUM(CASE WHEN flowRun.status = :failureStatus THEN flowRun.duration END)',
                'failedFlowRunsDuration',
            )
            .setParameters({
                successStatus: FlowRunStatus.SUCCEEDED,
                failureStatus: FlowRunStatus.FAILED,
                projectIds,
            })
            .groupBy('"projectId", "date"')
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

        const result = await flowRepo()
            .createQueryBuilder('flow')
            .addSelect('COUNT(flow.id)', 'workflowCount')
            .addSelect(
                'SUM(CASE WHEN flow.status = :enabledStatus THEN 1 END)',
                'activeWorkflowCount',
            )
            .addSelect(
                `(SELECT COUNT(*) FROM flow_run "flowRun"
                WHERE "flowRun"."projectId" IN (:...projectIds)
                AND DATE("flowRun"."finishTime") BETWEEN :start AND :end)`,
                'flowRunCount',
            )
            .where('flow.projectId IN (:...projectIds)', { projectIds })
            .setParameters({ enabledStatus: FlowStatus.ENABLED, start, end })
            .getRawOne()

        return {
            workflowCount: Number(result.workflowCount),
            activeWorkflowCount: Number(result.activeWorkflowCount),
            flowRunCount: Number(result.flowRunCount),
        }
    },
}

async function getProjectIds(platformId: string, userId: string ): Promise<string[]> {
    const result = await projectService.getAllForUser({
        platformId,
        userId,
    })
    const projectIds = result
        .map(project => project.id)
    return projectIds
}
