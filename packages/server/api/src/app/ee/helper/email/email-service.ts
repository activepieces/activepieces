import { AlertChannel, OtpType } from '@activepieces/ee-shared'
import { ApEdition, assertNotNullOrUndefined, InvitationType, UserIdentity, UserInvitation } from '@activepieces/shared'
import dayjs from 'dayjs'
import { FastifyBaseLogger } from 'fastify'
import { issuesService } from '../../../flows/issues/issues-service'
import { system } from '../../../helper/system/system'
import { platformService } from '../../../platform/platform.service'
import { projectService } from '../../../project/project-service'
import { alertsService } from '../../alerts/alerts-service'
import { domainHelper } from '../../custom-domains/domain-helper'
import { projectRoleService } from '../../projects/project-role/project-role.service'
import { emailSender, EmailTemplateData } from './email-sender/email-sender'

const EDITION = system.getEdition()
const EDITION_IS_NOT_PAID = ![ApEdition.CLOUD, ApEdition.ENTERPRISE].includes(EDITION)
const EDITION_IS_NOT_CLOUD = EDITION !== ApEdition.CLOUD
const MAX_ISSUES_EMAIL_LIMT = 50

export const emailService = (log: FastifyBaseLogger) => ({
    async sendInvitation({ userInvitation, invitationLink }: SendInvitationArgs): Promise<void> {
        log.info({
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
        await emailSender(log).send({
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

        log.info({
            name: '[emailService#sendIssueCreatedNotification]',
            projectId,
            flowName,
            createdAt,
        })

        const alerts = await alertsService(log).list({ projectId, cursor: undefined, limit: MAX_ISSUES_EMAIL_LIMT })
        const emails = alerts.data.filter((alert) => alert.channel === AlertChannel.EMAIL).map((alert) => alert.receiver)
        
        if (emails.length === 0) {
            return
        }

        await emailSender(log).send({
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
    async sendQuotaAlert({ projectId, resetDate, templateName }: SendQuotaAlertArgs): Promise<void> {
        if (EDITION_IS_NOT_CLOUD) {
            return
        }

        const project = await projectService.getOne(projectId)
        assertNotNullOrUndefined(project, 'project')

        const platform = await platformService.getOneWithPlanOrThrow(project.platformId)
        if (platform.plan.embeddingEnabled) {
            return
        }

        const alerts = await alertsService(log).list({ projectId, cursor: undefined, limit: MAX_ISSUES_EMAIL_LIMT })
        const emails = alerts.data.filter((alert) => alert.channel === AlertChannel.EMAIL).map((alert) => alert.receiver)

        if (emails.length === 0) {
            return
        }

        await emailSender(log).send({
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

    async sendOtp({ platformId, userIdentity, otp, type }: SendOtpArgs): Promise<void> {
        if (EDITION_IS_NOT_PAID) {
            return
        }

        if (userIdentity.verified && type === OtpType.EMAIL_VERIFICATION) {
            return
        }

        log.info('Sending OTP email', {
            email: userIdentity.email,
            otp,
            identityId: userIdentity.id,
            type,
        })

        const frontendPath = {
            [OtpType.EMAIL_VERIFICATION]: 'verify-email',
            [OtpType.PASSWORD_RESET]: 'reset-password',
        }

        const setupLink = await domainHelper.getPublicUrl({
            platformId,
            path: frontendPath[type] + `?otpcode=${otp}&identityId=${userIdentity.id}`,
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

        await emailSender(log).send({
            emails: [userIdentity.email],
            platformId: platformId ?? undefined,
            templateData: otpToTemplate[type],
        })
    },
    
    async sendReminderJobHandler(job: {
        projectId: string
        platformId: string
        projectName: string
    }): Promise<void> {
        const issues = await issuesService(log).list({ projectId: job.projectId, cursor: undefined, limit: 50 })
        if (issues.data.length === 0) {
            return
        }

        const alerts = await alertsService(log).list({ projectId: job.projectId, cursor: undefined, limit: 50 })
        const emails = alerts.data.filter((alert) => alert.channel === AlertChannel.EMAIL).map((alert) => alert.receiver)
        
        const issuesUrl = await domainHelper.getPublicUrl({
            platformId: job.platformId,
            path: 'runs?limit=10#Issues',
        })

        const issuesWithFormattedDate = issues.data.map((issue) => ({ 
            ...issue, 
            created: dayjs(issue.created).format('MMM D, h:mm a'),
            lastOccurrence: dayjs(issue.lastOccurrence).format('MMM D, h:mm a'), 
        }))

        if (emails.length === 0) {
            return
        }

        await emailSender(log).send({
            emails,
            platformId: job.platformId,
            templateData: {
                name: 'issues-reminder',
                vars: {
                    issuesUrl,
                    issuesCount: issues.data.length.toString(),
                    projectName: job.projectName,
                    issues: JSON.stringify(issuesWithFormattedDate),
                },
            },
        })
    },

    async sendTrialReminder({ platformId, firstName, customerEmail, templateName }: SendTrialReminderArgs): Promise<void> {
        await emailSender(log).send({
            emails: [customerEmail],
            platformId,
            templateData: {
                name: templateName,
                vars: {
                    year: new Date().getFullYear().toString(),
                    firstName: firstName ?? 'Automator',
                },
            },
        })

    },

    async sendExceedFailureThresholdAlert(projectId: string, flowName: string): Promise<void> {
        const alerts = await alertsService(log) .list({ projectId, cursor: undefined, limit: 50 })
        const emails = alerts.data.filter((alert) => alert.channel === AlertChannel.EMAIL).map((alert) => alert.receiver)
        const project = await projectService.getOneOrThrow(projectId)

        if (emails.length === 0) {
            return
        }

        await emailSender(log).send({
            emails,
            platformId: project.platformId,
            templateData: {
                name: 'trigger-failure',
                vars: {
                    flowName,
                    projectName: project.displayName,
                },
            },
        })
    },

})

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
            assertNotNullOrUndefined(userInvitation.projectRoleId, 'projectRoleId')
            const projectRole = await projectRoleService.getOneOrThrowById({
                id: userInvitation.projectRoleId,
            })
            const project = await projectService.getOneOrThrow(userInvitation.projectId)
            return {
                name: project.displayName,
                role: capitalizeFirstLetter(projectRole.name),
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
    userIdentity: UserIdentity
}

type SendTrialReminderArgs = {
    platformId: string
    firstName: string | undefined
    customerEmail: string
    templateName: '3-days-left-on-trial' | '7-days-in-trial' | '1-day-left-on-trial' | 'welcome-to-trial'
}

type IssueCreatedArgs = {
    projectId: string
    flowName: string
    platformId: string
    isIssue: boolean
    issueOrRunsPath: string
    createdAt: string
}