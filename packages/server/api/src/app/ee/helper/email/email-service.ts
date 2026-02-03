import { AlertChannel, OtpType } from '@activepieces/ee-shared'
import { ApEdition, assertNotNullOrUndefined, BADGES, InvitationType, isNil, UserIdentity, UserInvitation } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { z } from 'zod'
import { system } from '../../../helper/system/system'
import { platformService } from '../../../platform/platform.service'
import { projectService } from '../../../project/project-service'
import { userService } from '../../../user/user-service'
import { alertsService } from '../../alerts/alerts-service'
import { domainHelper } from '../../custom-domains/domain-helper'
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
            platformId: userInvitation.platformId,
            projectId: userInvitation.projectId,
            type: userInvitation.type,
            projectRole: userInvitation.projectRole,
            platformRole: userInvitation.platformRole,
        })
        const { email, platformId } = userInvitation
        const { name: projectName, role } = await getEntityNameForInvitation(userInvitation)
        await emailSender(log).send({
            emails: [email],
            platformId,
            templateData: {
                name: 'invitation-email',
                vars: {
                    setupLink: invitationLink,
                    projectName,
                    role,
                },
            },
        })
    },

    async sendProjectMemberAdded({ userInvitation }: SendProjectMemberAddedArgs): Promise<void> {
        log.info({
            message: '[emailService#sendProjectMemberAdded] sending project member added email',
            email: userInvitation.email,
            platformId: userInvitation.platformId,
            projectId: userInvitation.projectId,
            type: userInvitation.type,
            projectRole: userInvitation.projectRole,
            platformRole: userInvitation.platformRole,
        })
        const { email, platformId, projectId } = userInvitation
        const { name: projectName, role } = await getEntityNameForInvitation(userInvitation)
        const redirectPath = projectId ? `/projects/${projectId}/flows` : '/flows'
        const loginLink = await domainHelper.getPublicUrl({
            platformId,
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

    async sendOtp({ platformId, userIdentity, otp, type }: SendOtpArgs): Promise<void> {
        if (EDITION_IS_NOT_PAID) {
            return
        }

        if (userIdentity.verified && type === OtpType.EMAIL_VERIFICATION) {
            return
        }

        log.info({
            email: userIdentity.email,
            otp,
            identityId: userIdentity.id,
            type,
        }, 'Sending OTP email')

        const frontendPath = {
            [OtpType.EMAIL_VERIFICATION]: 'verify-email',
            [OtpType.PASSWORD_RESET]: 'reset-password',
        }

        const setupLink = await domainHelper.getInternalUrl({
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

    async sendBadgeAwardedEmail(userId: string, badgeName: string): Promise<void> {
        const user = await userService.getMetaInformation({ id: userId })

        if (isNil(user) || !isValidEmail(user.email)) {
            log.info({ userId, email: user?.email }, '[emailService#sendBadgeAwardedEmail] Skipping: external user has no valid email')
            return
        }
        const badge = BADGES[badgeName as keyof typeof BADGES]
        await emailSender(log).send({
            emails: [user.email],
            platformId: user.platformId!,
            templateData: {
                name: 'badge-awarded',
                vars: {
                    firstName: user.firstName,
                    badgeTitle: badge.title,
                    badgeDescription: badge.description,
                    badgeImageUrl: badge.imageUrl,
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

function isValidEmail(email: string): boolean {
    return z.email().safeParse(email).success
}

type SendInvitationArgs = {
    userInvitation: UserInvitation
    invitationLink: string
}

type SendProjectMemberAddedArgs = {
    userInvitation: UserInvitation
}

type SendOtpArgs = {
    type: OtpType
    platformId: string | null
    otp: string
    userIdentity: UserIdentity
}

type IssueCreatedArgs = {
    projectId: string
    flowName: string
    platformId: string
    isIssue: boolean
    issueOrRunsPath: string
    createdAt: string
}