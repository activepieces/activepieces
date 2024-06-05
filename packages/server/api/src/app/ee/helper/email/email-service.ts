import { jwtUtils } from '../../../helper/jwt-utils'
import { getEdition } from '../../../helper/secret-helper'
import { platformService } from '../../../platform/platform.service'
import { projectService } from '../../../project/project-service'
import { alertsService } from '../../alerts/alerts-service'
import { platformDomainHelper } from '../platform-domain-helper'
import { emailSender, EmailTemplateData } from './email-sender/email-sender'
import { AlertChannel, OtpType } from '@activepieces/ee-shared'
import { logger } from '@activepieces/server-shared'
import { ApEdition, assertNotNullOrUndefined, User } from '@activepieces/shared'

const EDITION = getEdition()

const EDITION_IS_NOT_PAID = ![ApEdition.CLOUD, ApEdition.ENTERPRISE].includes(EDITION)

const EDITION_IS_NOT_CLOUD = EDITION !== ApEdition.CLOUD

export const emailService = {
    async sendInvitation({ email, invitationId, projectId }: SendInvitationArgs): Promise<void> {
        if (EDITION_IS_NOT_PAID) {
            return
        }

        const project = await projectService.getOneOrThrow(projectId)

        const token = await jwtUtils.sign({
            payload: {
                id: invitationId,
            },
            key: await jwtUtils.getJwtSecret(),
        })

        const setupLink = await platformDomainHelper.constructUrlFrom({
            platformId: project.platformId,
            path: `invitation?token=${token}&email=${encodeURIComponent(email)}`,
        })

        await emailSender.send({
            emails: [email],
            platformId: project.platformId,
            templateData: {
                name: 'invitation-email',
                vars: {
                    setupLink,
                    projectName: project.displayName,
                },
            },
        })
    },

    async sendIssueCreatedNotification({
        projectId,
        flowName,
        count,
        createdAt,
    }: IssueCreatedArgs): Promise<void> {
        if (EDITION_IS_NOT_PAID) {
            return
        }
        logger.info({
            name: '[emailService#sendIssueCreatedNotification]',
            projectId,
            flowName,
            count,
            createdAt,
        })
        const project = await projectService.getOneOrThrow(projectId)

        const platform = await platformService.getOneOrThrow(project.platformId)
        if (platform.embeddingEnabled) {
            return
        }
        // TODO remove the hardcoded limit
        const alerts = await alertsService.list({ projectId, cursor: undefined, limit: 50 })
        const emails = alerts.data.filter((alert) => alert.channel === AlertChannel.EMAIL).map((alert) => alert.receiver)
        const issueUrl = await platformDomainHelper.constructUrlFrom({
            platformId: project.platformId,
            path: 'runs?limit=10#Issues',
        })
        await emailSender.send({
            emails,
            platformId: project.platformId,
            templateData: {
                name: 'issue-created',
                vars: {
                    issueUrl,
                    flowName,
                    createdAt,
                    count: count.toString(),
                },
            },
        })
    },

    async sendQuotaAlert({ email, projectId, resetDate, firstName, templateName }: SendQuotaAlertArgs): Promise<void> {
        if (EDITION_IS_NOT_CLOUD) {
            return
        }

        const project = await projectService.getOne(projectId)
        assertNotNullOrUndefined(project, 'project')

        const platform = await platformService.getOneOrThrow(project.platformId)
        if (platform.embeddingEnabled) {
            return
        }

        await emailSender.send({
            emails: [email],
            platformId: project.platformId,
            templateData: {
                name: templateName,
                vars: {
                    resetDate,
                    firstName,
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
            firstName: user.email,
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
                    firstName: user.firstName,
                },
            },
        }

        await emailSender.send({
            emails: [user.email],
            platformId: platformId ?? undefined,
            templateData: otpToTemplate[type],
        })
    },
}

type SendInvitationArgs = {
    email: string
    invitationId: string
    projectId: string
}

type SendQuotaAlertArgs = {
    email: string
    projectId: string
    resetDate: string
    firstName: string
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
    lastSeenAt: string
    count: number
    createdAt: string
}