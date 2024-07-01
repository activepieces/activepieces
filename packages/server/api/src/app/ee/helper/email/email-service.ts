import { AlertChannel, OtpType } from '@activepieces/ee-shared'
import { logger, system } from '@activepieces/server-shared'
import { ApEdition, assertNotNullOrUndefined, InvitationType, User, UserInvitation } from '@activepieces/shared'
import { platformService } from '../../../platform/platform.service'
import { projectService } from '../../../project/project-service'
import { alertsService } from '../../alerts/alerts-service'
import { platformDomainHelper } from '../platform-domain-helper'
import { emailSender, EmailTemplateData } from './email-sender/email-sender'

const EDITION = system.getEdition()
const EDITION_IS_NOT_PAID = ![ApEdition.CLOUD, ApEdition.ENTERPRISE].includes(EDITION)

const EDITION_IS_NOT_CLOUD = EDITION !== ApEdition.CLOUD

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
        const alerts = await alertsService.list({ projectId, cursor: undefined, limit: 50 })
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
        const alerts = await alertsService.list({ projectId, cursor: undefined, limit: 50 })
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