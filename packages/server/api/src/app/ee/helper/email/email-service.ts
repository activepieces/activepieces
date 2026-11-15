import { assertNotNullOrUndefined, isNil, unique } from '@activepieces/core-utils'
import { AlertChannel, ApEdition, InvitationType, OtpType, UserIdentity, UserInvitation } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { domainHelper } from '../../../helper/domain-helper'
import { system } from '../../../helper/system/system'
import { platformService } from '../../../platform/platform.service'
import { projectService } from '../../../project/project-service'
import { alertsService } from '../../alerts/alerts-service'
import { projectRoleService } from '../../projects/project-role/project-role.service'
import { emailSender, EmailTemplateData } from './email-sender/email-sender'

const EDITION = system.getEdition()
const EDITION_IS_NOT_PAID = ![ApEdition.CLOUD, ApEdition.ENTERPRISE].includes(EDITION)
const MAX_ISSUES_EMAIL_LIMT = 50

export const emailService = (log: FastifyBaseLogger) => ({
    async sendInvitation({ userInvitation, invitationLink }: SendInvitationArgs): Promise<void> {
        log.info({
            message: '[emailService#sendInvitation] sending invitation email',
            email: userInvitation.email,
            platform: { id: userInvitation.platformId },
            project: { id: userInvitation.projectId },
            type: userInvitation.type,
            projectRole: userInvitation.projectRole,
            platformRole: userInvitation.platformRole,
        })
        const { email, platformId } = userInvitation
        const { name: projectName } = await getEntityNameForInvitation(userInvitation, log)
        await emailSender(log).send({
            emails: [email],
            platformId,
            templateData: {
                name: 'invitation-email',
                vars: {
                    setupLink: invitationLink,
                    projectName,
                },
            },
        })
    },

    async sendProjectMemberAdded({ userInvitation }: SendProjectMemberAddedArgs): Promise<void> {
        log.info({
            message: '[emailService#sendProjectMemberAdded] sending project member added email',
            email: userInvitation.email,
            platform: { id: userInvitation.platformId },
            project: { id: userInvitation.projectId },
            type: userInvitation.type,
            projectRole: userInvitation.projectRole,
            platformRole: userInvitation.platformRole,
        })
        const { email, platformId, projectId } = userInvitation
        const { name: projectName, role } = await getEntityNameForInvitation(userInvitation, log)
        const redirectPath = projectId ? `/projects/${projectId}/flows` : '/flows'
        const loginLink = await domainHelper.getPublicUrl({
            path: `sign-in?from=${encodeURIComponent(redirectPath)}`,
        })
        await emailSender(log).send({
            emails: [email],
            platformId,
            templateData: {
                name: 'project-member-added',
                vars: {
                    projectName,
                    role,
                    loginLink,
                },
            },
        })
    },

    async sendScimUserWelcome({ email, platformId }: SendScimUserWelcomeArgs): Promise<void> {
        if (EDITION_IS_NOT_PAID) {
            return
        }

        log.info({
            message: '[emailService#sendScimUserWelcome] sending welcome email',
            email,
            platform: { id: platformId },
        })

        const loginLink = await domainHelper.getPublicUrl({
            path: 'sign-in',
        })

        await emailSender(log).send({
            emails: [email],
            platformId,
            templateData: {
                name: 'scim-user-welcome',
                vars: {
                    loginLink,
                },
            },
        })
    },

    async sendPlatformDeleted({ platformId, email, purgeDate }: SendPlatformDeletedArgs): Promise<void> {
        log.info({
            message: '[emailService#sendPlatformDeleted] sending platform deleted email',
            platform: { id: platformId },
        })
        await emailSender(log).send({
            emails: [email],
            platformId,
            templateData: {
                name: 'platform-deleted',
                vars: {
                    purgeDate,
                },
            },
        })
    },

    async sendIssueCreatedNotification({
        projectId,
        projectName,
        flowName,
        platformId,
        runUrl,
        createdAt,
        failedStepDisplayName,
        failedStepNumber,
        failedStepMessage,
        flowOwnerEmail,
    }: IssueCreatedArgs): Promise<void> {
        if (EDITION_IS_NOT_PAID) {
            return
        }

        log.info({
            name: '[emailService#sendIssueCreatedNotification]',
            project: { id: projectId },
            flowName,
            createdAt,
        })

        const alerts = await alertsService(log).list({ projectId, cursor: undefined, limit: MAX_ISSUES_EMAIL_LIMT })
        const alertEmails = alerts.data.filter((alert) => alert.channel === AlertChannel.EMAIL).map((alert) => alert.receiver)
        const emails = unique([
            ...alertEmails,
            ...(isNil(flowOwnerEmail) ? [] : [flowOwnerEmail]),
        ].map((email) => email.toLowerCase()))

        if (emails.length === 0) {
            return
        }

        await emailSender(log).send({
            emails,
            platformId,
            templateData: {
                name: 'issue-created',
                vars: {
                    projectName,
                    flowName,
                    createdAt,
                    runUrl,
                    failedStepDisplayName,
                    failedStepNumber: failedStepNumber ? `${failedStepNumber}` : '',
                    failedStepMessage: failedStepMessage ?? '',
                },
            },
        })
    },

    async sendOtp({ platformId, userIdentity, otp, type }: SendOtpArgs): Promise<void> {
        if (EDITION_IS_NOT_PAID && type !== OtpType.EMAIL_LOGIN) {
            return
        }

        if (userIdentity.verified && type === OtpType.EMAIL_VERIFICATION) {
            return
        }

        log.info({
            email: userIdentity.email,
            identityId: userIdentity.id,
            type,
        }, 'Sending OTP email')

        await emailSender(log).send({
            emails: [userIdentity.email],
            platformId: platformId ?? undefined,
            templateData: await otpTemplateData({ type, otp, identityId: userIdentity.id }),
        })
    },

    async sendChatNotification({ platformId, to, subject, body, senderName, senderEmail }: SendChatNotificationArgs): Promise<void> {
        log.info({
            platform: { id: platformId },
            recipientCount: to.length,
            subject,
        }, '[emailService#sendChatNotification] sending chat notification email')

        await emailSender(log).send({
            emails: to,
            platformId,
            replyTo: senderEmail,
            templateData: {
                name: 'chat-notification',
                vars: {
                    subject,
                    body,
                    senderName,
                    senderEmail,
                },
            },
        })
    },
})

async function otpTemplateData({ type, otp, identityId }: OtpTemplateDataParams): Promise<EmailTemplateData> {
    switch (type) {
        case OtpType.EMAIL_LOGIN:
            return { name: 'login-code', vars: { code: otp } }
        case OtpType.EMAIL_VERIFICATION:
            return {
                name: 'verify-email',
                vars: { setupLink: await otpSetupLink({ path: 'verify-email', otp, identityId }) },
            }
        case OtpType.PASSWORD_RESET:
            return {
                name: 'reset-password',
                vars: { setupLink: await otpSetupLink({ path: 'reset-password', otp, identityId }) },
            }
    }
}

async function otpSetupLink({ path, otp, identityId }: OtpSetupLinkParams): Promise<string> {
    return domainHelper.getInternalUrl({
        path: `${path}?otpcode=${otp}&identityId=${identityId}`,
    })
}

async function getEntityNameForInvitation(userInvitation: UserInvitation, log: FastifyBaseLogger): Promise<{ name: string, role: string }> {
    switch (userInvitation.type) {
        case InvitationType.PLATFORM: {
            const platform = await platformService(log).getOneOrThrow(userInvitation.platformId)
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
            const project = await projectService(log).getOneOrThrow(userInvitation.projectId)
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

type SendProjectMemberAddedArgs = {
    userInvitation: UserInvitation
}

type OtpTemplateDataParams = {
    type: OtpType
    otp: string
    identityId: string
}

type OtpSetupLinkParams = {
    path: string
    otp: string
    identityId: string
}

type SendOtpArgs = {
    type: OtpType
    platformId: string | null
    otp: string
    userIdentity: UserIdentity
}

type SendScimUserWelcomeArgs = {
    email: string
    platformId: string
}

type SendPlatformDeletedArgs = {
    platformId: string
    email: string
    purgeDate: string
}

type SendChatNotificationArgs = {
    platformId: string
    to: string[]
    subject: string
    body: string
    senderName: string
    senderEmail: string
}

type IssueCreatedArgs = {
    projectId: string
    projectName: string
    flowName: string
    platformId: string
    runUrl: string
    createdAt: string
    failedStepDisplayName: string
    failedStepNumber?: number
    failedStepMessage?: string
    flowOwnerEmail?: string
}
