import { OtpType } from '@activepieces/ee-shared'
import { ApEdition, User, assertNotNullOrUndefined, isNil } from '@activepieces/shared'
import { logger } from 'server-shared'
import { getEdition } from '../../../helper/secret-helper'
import { projectService } from '../../../project/project-service'
import { platformDomainHelper } from '../platform-domain-helper'
import { jwtUtils } from '../../../helper/jwt-utils'
import { EmailTemplateData, emailSender } from './email-sender/email-sender'

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
            email,
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

    async sendQuotaAlert({ email, projectId, resetDate, firstName, templateName }: SendQuotaAlertArgs): Promise<void> {
        if (EDITION_IS_NOT_CLOUD) {
            return
        }

        const project = await projectService.getOne(projectId)
        assertNotNullOrUndefined(project, 'project')

        if (!isNil(project.platformId)) {
            // Don't Inform the project users, as there should be a feature to manage billing by platform owners, If we send an emails to the project users It will confuse them since the email is not white labled.
            return
        }

        await emailSender.send({
            email,
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
            email: user.email,
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
