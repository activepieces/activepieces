import { AnalyticsResultMap, FlowRunStatus, GetAnalyticsParams } from '@activepieces/shared'
import { flowRunRepo } from '../flows/flow-run/flow-run-service'

export const analyticsService = {
    async getAnalyticsData({
        startTimestamp,
        endTimestamp,
    }: GetAnalyticsParams): Promise<AnalyticsResultMap> {
        const query = flowRunRepo()
            .createQueryBuilder('flowRun')
            .select('flowRun.flowId', 'flowId')
            .addSelect('COUNT(*)', 'flowRunCount')
            .addSelect('AVG(flowRun.duration)', 'averageRuntime')
            .addSelect(
                'SUM(CASE WHEN flowRun.status = :successStatus THEN 1 ELSE 0 END)',
                'successCount',
            )
            .addSelect(
                'SUM(CASE WHEN flowRun.status = :failureStatus THEN 1 ELSE 0 END)',
                'failureCount',
            )
            .addSelect(
                '(SUM(CASE WHEN flowRun.status = :successStatus THEN 1 ELSE 0 END) / COUNT(*)) * 100',
                'successRate',
            )
            .addSelect(
                '(SUM(CASE WHEN flowRun.status = :failureStatus THEN 1 ELSE 0 END) / COUNT(*)) * 100',
                'failureRate',
            )
            .where('flowRun.finishTime BETWEEN :start AND :end', {
                start: startTimestamp.toString(),
                end: endTimestamp.toString(),
            })
            .setParameters({
                successStatus: FlowRunStatus.SUCCEEDED,
                failureStatus: FlowRunStatus.FAILED,
            })
            .groupBy('flowRun.flowId')

        const rawResults = await query.getRawMany()

        const analytics: AnalyticsResultMap = {}

        for (const result of rawResults) {
            const flowId = result.flowId
            analytics[flowId] = {
                averageRuntime: parseFloat(result.averageRuntime) || 0,
                flowRunCount: parseInt(result.flowRunCount, 10),
                successRate: parseFloat(result.successRate) || 0,
                failureRate: parseFloat(result.failureRate) || 0,
            }
        }

        return analytics
    },
}
