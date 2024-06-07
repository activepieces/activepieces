import { FlowRunHooks } from '../../flows/flow-run/flow-run-hooks'
import { getEdition } from '../../helper/secret-helper'
import { projectUsageService } from '../../project/usage/project-usage-service'
import { emailService } from '../helper/email/email-service'
import { ActivepiecesError, ApEdition, ErrorCode } from '@activepieces/shared'

export const platformRunHooks: FlowRunHooks = {
    async onFinish({
        projectId,
        tasks,
    }: {
        projectId: string
        tasks: number
    }): Promise<void> {
        const edition = getEdition()
        if ([ApEdition.CLOUD, ApEdition.ENTERPRISE].includes(edition)) {
            await projectUsageService.increaseTasks(
                projectId,
                tasks,
            )
        }
    },
    async limitTasksPerMonth({
        projectId,
        createdAt,
        tasks,
        consumedTasks,
        previousUsage,
    }: {
        projectId: string
        createdAt: string
        tasks: number
        consumedTasks: number
        previousUsage: number
    }): Promise<void> {
        const quotaAlerts: { limit: number, templateName: 'quota-50' | 'quota-90' | 'quota-100' }[] = [
            { limit: 1.0, templateName: 'quota-100' },
            { limit: 0.9, templateName: 'quota-90' },
            { limit: 0.5, templateName: 'quota-50' },
        ]
        const resetDate = projectUsageService.getCurrentingEndPeriod(createdAt)
        const currentUsagePercentage = (consumedTasks / tasks) * 100
        const previousUsagePercentage = (previousUsage / tasks) * 100
    
        for (const { limit, templateName } of quotaAlerts) {
            const projectPlanPercentage = tasks * limit
            if (currentUsagePercentage >= projectPlanPercentage && previousUsagePercentage < projectPlanPercentage) {
                await emailService.sendQuotaAlert({
                    resetDate,
                    templateName,
                    projectId,
                })
            }
        }
    
        if (consumedTasks > tasks) {
            throw new ActivepiecesError({
                code: ErrorCode.QUOTA_EXCEEDED,
                params: {
                    metric: 'tasks',
                    quota: tasks,
                },
            })
        }
    },
}