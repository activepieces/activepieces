import { AlertChannel, OtpType, PopulatedIssue } from '@activepieces/ee-shared'
import { logger, system } from '@activepieces/server-shared'
import { ApEdition, assertNotNullOrUndefined, InvitationType, User, UserInvitation } from '@activepieces/shared'
import dayjs from 'dayjs'
import { getRedisConnection } from '../../../database/redis-connection'
import { systemJobsSchedule } from '../../../helper/system-jobs'
import { SystemJobName } from '../../../helper/system-jobs/common'
import { platformService } from '../../../platform/platform.service'
import { projectService } from '../../../project/project-service'
import { alertsService } from '../../alerts/alerts-service'
import { issuesService } from '../../issues/issues-service'
import { platformDomainHelper } from '../platform-domain-helper'
import { emailSender, EmailTemplateData } from './email-sender/email-sender'

const EDITION = system.getEdition()
const EDITION_IS_NOT_PAID = ![ApEdition.CLOUD, ApEdition.ENTERPRISE].includes(EDITION)

const EDITION_IS_NOT_CLOUD = EDITION !== ApEdition.CLOUD

const MAX_ISSUES_EMAIL_LIMT = 50

export const emailService = {
    async sendInvitation({ userInvitation, invitationLink }: SendInvitationArgs): Promise<void> {
        logger.info({
            message: '[emailService#sendInvitation] sending invitation email',
            email: userInvitation.email,
            platformId: userInvitation.platformId,
            projectId: userInvitation.projectId,
            type: userInvitation.type,
            projectRole: userInvitation.projectRole,
            platformRole: userInvitation.platformRole,
        })
        const { email, platformId } = userInvitation
        const { name: projectOrPlatformName, role } = await getEntityNameForInvitation(userInvitation)

        await emailSender.send({
            emails: [email],
            platformId,
            templateData: {
                name: 'invitation-email',
                vars: {
                    setupLink: invitationLink,
                    projectOrPlatformName,
                    role,
                },
            },
        })
    },

    async sendIssueCreatedNotification({
        projectId,
        flowName,
        platformId,
        issueOrRunsPath,
        isIssue,
        createdAt,
    }: IssueCreatedArgs): Promise<void> {
        if (EDITION_IS_NOT_PAID) {
            return
        }

        logger.info({
            name: '[emailService#sendIssueCreatedNotification]',
            projectId,
            flowName,
            createdAt,
        })

        // TODO remove the hardcoded limit
        const alerts = await alertsService.list({ projectId, cursor: undefined, limit: MAX_ISSUES_EMAIL_LIMT })
        const emails = alerts.data.filter((alert) => alert.channel === AlertChannel.EMAIL).map((alert) => alert.receiver)
        
        await emailSender.send({
            emails,
            platformId,
            templateData: {
                name: 'issue-created',
                vars: {
                    flowName,
                    createdAt,
                    isIssue: isIssue.toString(),
                    issueUrl: issueOrRunsPath,
                },
            },
        })
    },

    async sendIssuesReminder({ projectId }: { projectId: string }): Promise<void> {
        const project = await projectService.getOneOrThrow(projectId)
        const platform = await platformService.getOneOrThrow(project.platformId)
        if (!platform.flowIssuesEnabled || platform.embeddingEnabled) {
            return
        }
        
        const issues = await issuesService.list({ projectId, cursor: undefined, limit: 50 })
        if (issues.data.length === 0) {
            return
        }

        const reminderKey = `reminder:${projectId}`
        const isEmailScheduled = await getRedisConnection().get(reminderKey)
        if (isEmailScheduled) {
            return
        }

        const endOfDay = dayjs().endOf('day')
        await getRedisConnection().set(reminderKey, 0, 'EXAT', endOfDay.unix())
        
        const alerts = await alertsService.list({ projectId, cursor: undefined, limit: 50 })
        const emails = alerts.data.filter((alert) => alert.channel === AlertChannel.EMAIL).map((alert) => alert.receiver)
        
        const issuesUrl = await platformDomainHelper.constructUrlFrom({
            platformId: project.platformId,
            path: 'runs?limit=10#Issues',
        })

        const issuesWithFormattedDate = issues.data.map((issue) => ({ 
            ...issue, 
            created: dayjs(issue.created).format('MMM d, h:mm a'),
            lastOccurrence: dayjs(issue.lastOccurrence).format('MMM d, h:mm a'), 
        }))
        
        await systemJobsSchedule.upsertJob({
            job: {
                name: SystemJobName.ISSUES_REMINDER,
                data: {
                    emails,
                    issuesUrl,
                    issuesWithFormattedDate,
                    platformId: project.platformId,
                    projectDisplayName: project.displayName,
                },
                jobId: `issues-reminder-${projectId}`,
            },
            schedule: {
                type: 'one-time',
                date: endOfDay,
            },
        })
    },

    async sendQuotaAlert({ projectId, resetDate, templateName }: SendQuotaAlertArgs): Promise<void> {
        if (EDITION_IS_NOT_CLOUD) {
            return
        }

        const project = await projectService.getOne(projectId)
        assertNotNullOrUndefined(project, 'project')

        const platform = await platformService.getOneOrThrow(project.platformId)
        if (!platform.alertsEnabled || platform.embeddingEnabled) {
            return
        }

        // TODO remove the hardcoded limit
        const alerts = await alertsService.list({ projectId, cursor: undefined, limit: MAX_ISSUES_EMAIL_LIMT })
        const emails = alerts.data.filter((alert) => alert.channel === AlertChannel.EMAIL).map((alert) => alert.receiver)

        await emailSender.send({
            emails,
            platformId: project.platformId,
            templateData: {
                name: templateName,
                vars: {
                    resetDate,
                },
            },
        })
    },

    async sendOtp({ platformId, user, otp, type }: SendOtpArgs): Promise<void> {
        if (EDITION_IS_NOT_PAID) {
            return
        }

        if (user.verified && type === OtpType.EMAIL_VERIFICATION) {
            return
        }

        logger.info('Sending OTP email', {
            email: user.email,
            otp,
            userId: user.id,
            type,
        })

        const frontendPath = {
            [OtpType.EMAIL_VERIFICATION]: 'verify-email',
            [OtpType.PASSWORD_RESET]: 'reset-password',
        }

        const setupLink = await platformDomainHelper.constructUrlFrom({
            platformId,
            path: frontendPath[type] + `?otpcode=${otp}&userId=${user.id}`,
        })

        const otpToTemplate: Record<string, EmailTemplateData> = {
            [OtpType.EMAIL_VERIFICATION]: {
                name: 'verify-email',
                vars: {
                    setupLink,
                },
            },
            [OtpType.PASSWORD_RESET]: {
                name: 'reset-password',
                vars: {
                    setupLink,
                },
            },
        }

        await emailSender.send({
            emails: [user.email],
            platformId: platformId ?? undefined,
            templateData: otpToTemplate[type],
        })
    },
    
    async sendingRemindersJobHandler(job: {
        emails: string[]
        platformId: string
        issuesUrl: string
        issuesWithFormattedDate: PopulatedIssue[]
        projectDisplayName: string
    }): Promise<void> {
        await emailSender.send({
            emails: job.emails,
            platformId: job.platformId,
            templateData: {
                name: 'issues-reminder',
                vars: {
                    issuesUrl: job.issuesUrl,
                    issues: JSON.stringify(job.issuesWithFormattedDate),
                    projectName: job.projectDisplayName,
                },
            },
        })
    },
}

async function getEntityNameForInvitation(userInvitation: UserInvitation): Promise<{ name: string, role: string }> {
    switch (userInvitation.type) {
        case InvitationType.PLATFORM: {
            const platform = await platformService.getOneOrThrow(userInvitation.platformId)
            assertNotNullOrUndefined(userInvitation.platformRole, 'platformRole')
            return {
                name: platform.name,
                role: capitalizeFirstLetter(userInvitation.platformRole),
            }
        }
        case InvitationType.PROJECT: {
            assertNotNullOrUndefined(userInvitation.projectId, 'projectId')
            assertNotNullOrUndefined(userInvitation.projectRole, 'projectRole')
            const project = await projectService.getOneOrThrow(userInvitation.projectId)
            return {
                name: project.displayName,
                role: capitalizeFirstLetter(userInvitation.projectRole),
            }
        }
    }
}

function capitalizeFirstLetter(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

type SendInvitationArgs = {
    userInvitation: UserInvitation
    invitationLink: string
}

type SendQuotaAlertArgs = {
    projectId: string
    resetDate: string
    templateName: 'quota-50' | 'quota-90' | 'quota-100'
}

type SendOtpArgs = {
    type: OtpType
    platformId: string | null
    otp: string
    user: User
}

type IssueCreatedArgs = {
    projectId: string
    flowName: string
    platformId: string
    isIssue: boolean
    issueOrRunsPath: string
    createdAt: string
}