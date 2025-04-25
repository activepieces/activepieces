import { AnalyticsResponse, FlowRunStatus, FlowStatus, OverviewResponse } from '@activepieces/shared'
import dayjs from 'dayjs'
import { flowRepo } from '../flows/flow/flow.repo'
import { flowRunRepo } from '../flows/flow-run/flow-run-service'


type GetAnalyticsDataParams = {
    startDate: string
    endDate: string
    projectId: string
}

export const analyticsService = {
    async getAnalyticsData(params: GetAnalyticsDataParams): Promise<AnalyticsResponse> {
        const { startDate, endDate, projectId } = params

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
            .andWhere('flowRun.projectId = :projectId', { projectId })
            .setParameters({
                successStatus: FlowRunStatus.SUCCEEDED,
                failureStatus: FlowRunStatus.FAILED,
            })
            .groupBy('DATE(flowRun.finishTime)')
            .orderBy('date', 'ASC')

        const rawResults = await query.getRawMany()

        const results: AnalyticsResponse = rawResults.map(result => ({
            date: result.date.toISOString(),
            successfulFlowRuns: Number(result.successfulFlowRuns),
            failedFlowRuns: Number(result.failedFlowRuns),
            successfulFlowRunsDuration: Number(result.successfulFlowRunsDuration),
            failedFlowRunsDuration: Number(result.failedFlowRunsDuration),
        }))

        return results
    },
    async getOverview(projectId: string): Promise<OverviewResponse> {
        const { start, end } = {
            start: dayjs().startOf('month').toISOString(),
            end: dayjs().endOf('month').toISOString(),
        }

        const result = await flowRepo()
            .createQueryBuilder('f')
            .select([
                'COUNT(f.id) AS "workflowCount"',
                `SUM(CASE 
                        WHEN f.status = :flowStatus AND f."projectId" = :projectId 
                        THEN 1 ELSE 0 
                    END) AS "activeWorkflowCount"`,
                `(SELECT COUNT(*) FROM flow_run fr 
                        WHERE fr."projectId" = :projectId 
                        AND fr."finishTime" BETWEEN :start AND :end
                    ) AS "flowRunCount"`,
            ])
            .where('f.projectId = :projectId', { projectId })
            .setParameters({ flowStatus: FlowStatus.ENABLED, start, end })
            .getRawOne()

        return {
            workflowCount: Number(result.workflowCount),
            activeWorkflowCount: Number(result.activeWorkflowCount),
            flowRunCount: Number(result.flowRunCount),
        }
    },
}
