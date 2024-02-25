import { ProjectUsage } from '@activepieces/shared'
import { flowRunService } from '../../flows/flow-run/flow-run-service'
import { projectMemberService } from '../../ee/project-members/project-member.service'
import { apDayjs } from '../../helper/dayjs-helper'


export const projectUsageService = {
    async getDayUsageForBillingPeriod(projectId: string, startBillingPeriod: string): Promise<ProjectUsage> {
        const flowTasks = await flowRunService.getTasksUsedAfter({
            projectId,
            created: getCurrentingStartPeriod(startBillingPeriod),
        })
        const teamMembers = await projectMemberService.countTeamMembersIncludingOwner(projectId)
        return {
            tasks: flowTasks,
            teamMembers,
        }
    },
    getCurrentingStartPeriod,
    getCurrentingEndPeriod,
}

function getCurrentingStartPeriod(datetime: string): string {
    const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000
    const date = apDayjs(datetime)
    const currentDate = apDayjs()
    const nextResetInMs = (currentDate.diff(date, 'millisecond') % thirtyDaysInMs)
    return currentDate.subtract(nextResetInMs, 'millisecond').toISOString()
}

function getCurrentingEndPeriod(datetime: string): string {
    return apDayjs(getCurrentingStartPeriod(datetime)).add(30, 'days').toISOString()
}