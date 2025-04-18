import { AnalyticsResult, FlowRunStatus, FlowStatus, GetAnalyticsParams, OverviewResult } from '@activepieces/shared'
import dayjs from 'dayjs'
import { flowRepo } from '../flows/flow/flow.repo'
import { flowRunRepo } from '../flows/flow-run/flow-run-service'

export const analyticsService = {
    async getAnalyticsData({
        startDate,
        endDate,
    }: GetAnalyticsParams): Promise<AnalyticsResult[]> {
        const query = flowRunRepo()
            .createQueryBuilder('flowRun')
            .select('DATE(flowRun.finishTime)', 'date')
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
            .where('DATE(flowRun.finishTime) BETWEEN :start AND :end', {
                start: startDate,
                end: endDate,
            })
            .setParameters({
                successStatus: FlowRunStatus.SUCCEEDED,
                failureStatus: FlowRunStatus.FAILED,
            })
            .groupBy('DATE(flowRun.finishTime)')
            .orderBy('date', 'ASC')

        const rawResults = await query.getRawMany()

        const results: AnalyticsResult[] = rawResults.map(result => ({
            date: result.date,
            successfulFlowRuns: parseInt(result.successfulFlowRuns) || 0,
            failedFlowRuns: parseInt(result.failedFlowRuns) || 0,
            successfulFlowRunsDuration: parseInt(result.successfulFlowRunsDuration) || 0,
            failedFlowRunsDuration: parseInt(result.failedFlowRunsDuration) || 0,
        }))

        return results
    },
    async getWorkflowOverview(): Promise<OverviewResult> {
        const workflowCount = await flowRepo().count()

        const activeWorkflowCount = await flowRepo().count({
            where: {
                status: FlowStatus.ENABLED,
            },
        })

        const flowRunCount = await flowRunRepo().createQueryBuilder('flowRun')
            .where('flowRun.finishTime BETWEEN :start AND :end', {
                start: dayjs().startOf('month').toISOString(),
                end: dayjs().endOf('month').toISOString(),
            })
            .getCount()

        return {
            workflowCount,
            activeWorkflowCount,
            flowRunCount,
        }
    },
}
