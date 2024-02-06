import { getEdition } from '../../../helper/secret-helper'
import { ApEdition, User, assertNotNullOrUndefined, isNil } from '@activepieces/shared'
import fs from 'node:fs/promises'
import Mustache from 'mustache'
import nodemailer from 'nodemailer'

import { platformService } from '../../platform/platform.service'
import { defaultTheme } from '../../../flags/theme'
import { projectService } from '../../../project/project-service'
import { system } from '../../../helper/system/system'
import { SystemProp } from '../../../helper/system/system-prop'
import { OtpType, Platform } from '@activepieces/shared'
import { logger } from '../../../helper/logger'
import { platformDomainHelper } from '../platform-domain-helper'
import { jwtUtils } from '../../../helper/jwt-utils'
import { ProjectMemberToken } from '../../project-members/project-member.service'

const EDITION = getEdition()
const EDITION_IS_NOT_PAID = ![ApEdition.CLOUD, ApEdition.ENTERPRISE].includes(EDITION)
const EDITION_IS_NOT_CLOUD = EDITION !== ApEdition.CLOUD

export const emailService = {
    async sendInvitation({ email, invitationId, projectId }: { email: string, invitationId: string, projectId: string }): Promise<void> {
        if (EDITION_IS_NOT_PAID) {
            return
        }

        const project = await projectService.getOneOrThrow(projectId)
        const memberToken: ProjectMemberToken = {
            id: invitationId,
        }
        const token = await jwtUtils.sign({
            payload: memberToken,
            key: await jwtUtils.getJwtSecret(),
        })
        const setupLink = await platformDomainHelper.constructUrlFrom({
            platformId: project.platformId,
            path: `invitation?token=${token}&email=${encodeURIComponent(email)}`,
        })

        await sendEmail({
            email,
            platformId: project.platformId,
            template: {
                templateName: 'invitation-email',
                data: {
                    setupLink,
                    projectName: project.displayName,
                },
            },
        })
    },

    async sendQuotaAlert({ email, projectId, resetDate, firstName, templateId }: { email: string, projectId: string, resetDate: string, firstName: string, templateId: 'quota-50' | 'quota-90' | 'quota-100' }): Promise<void> {
        if (EDITION_IS_NOT_CLOUD) {
            return
        }

        const project = await projectService.getOne(projectId)
        assertNotNullOrUndefined(project, 'project')

        if (!isNil(project.platformId)) {
            // Don't Inform the project users, as there should be a feature to manage billing by platform owners, If we send an emails to the project users It will confuse them since the email is not white labled.
            return
        }

        await sendEmail({
            email,
            platformId: project.platformId,
            template: {
                templateName: templateId,
                data: {
                    resetDate,
                    firstName,
                },
            },
        })
    },
    async sendOtpEmail({ platformId, user, otp, type }: SendOtpEmailParams): Promise<void> {
        const edition = getEdition()
        if (![ApEdition.CLOUD, ApEdition.ENTERPRISE].includes(edition)) {
            return
        }
        if (user.verified && type === OtpType.EMAIL_VERIFICATION) {
            return
        }
        logger.info('Sending OTP email', { email: user.email, otp, userId: user.id, firstName: user.email, type })
        const frontendPath = {
            [OtpType.EMAIL_VERIFICATION]: 'verify-email',
            [OtpType.PASSWORD_RESET]: 'reset-password',
        }

        const setupLink = await platformDomainHelper.constructUrlFrom({
            platformId,
            path: frontendPath[type] + `?otpcode=${otp}&userId=${user.id}`,
        })

        const otpToTemplate: Record<string, EmailTemplate> = {
            [OtpType.EMAIL_VERIFICATION]: {
                templateName: 'verify-email',
                data: {
                    setupLink,
                },
            },
            [OtpType.PASSWORD_RESET]: {
                templateName: 'reset-password',
                data: {
                    setupLink,
                    firstName: user.firstName,
                },
            },
        }

        await sendEmail({
            email: user.email,
            platformId: platformId ?? undefined,
            template: otpToTemplate[type],
        })
    },
}




async function sendEmail({ platformId, email, template }: { template: EmailTemplate, email: string, platformId: string | undefined }): Promise<void> {
    const platform = isNil(platformId) ? null : await platformService.getOne(platformId)
    const transporter = nodemailer.createTransport({
        host: platform?.smtpHost ?? system.getOrThrow(SystemProp.SMTP_HOST),
        port: platform?.smtpPort ?? system.getNumber(SystemProp.SMTP_PORT)!,
        auth: {
            user: platform?.smtpUser ?? system.getOrThrow(SystemProp.SMTP_USERNAME),
            pass: platform?.smtpPassword ?? system.getOrThrow(SystemProp.SMTP_PASSWORD),
        },
        secure: platform?.smtpUseSSL ?? system.getBoolean(SystemProp.SMTP_USE_SSL),
    })
    const templateToSubject = {
        'invitation-email': 'You have been invited to a team',
        'quota-50': '[ACTION REQUIRED] 50% of your Activepieces tasks are consumed',
        'quota-90': '[URGENT] 90% of your Activepieces tasks are consumed',
        'quota-100': '[URGENT] 100% of your Activepieces tasks are consumed',
        'verify-email': 'Verify your email address',
        'reset-password': 'Reset your password',
    }

    const senderName = platform?.name ?? system.get(SystemProp.SMTP_SENDER_NAME)
    const senderEmail = platform?.smtpSenderEmail ?? system.get(SystemProp.SMTP_SENDER_EMAIL)
    await transporter.sendMail({
        from: `${senderName} <${senderEmail}>`,
        to: email,
        subject: templateToSubject[template.templateName],
        html: await renderTemplate({ platform, request: template }),
    })
}

async function renderTemplate({
    platform,
    request,
}: { request: EmailTemplate, platform: Platform | null }): Promise<string> {
    const templateHtml = await readTemplateFile(request.templateName)
    return Mustache.render(templateHtml, {
        ...request.data,
        primaryColor: platform?.primaryColor ?? defaultTheme.colors.primary.default,
        fullLogoUrl: platform?.fullLogoUrl ?? defaultTheme.logos.fullLogoUrl,
        platformName: platform?.name ?? defaultTheme.websiteName,
    })
}

async function readTemplateFile(templateName: string): Promise<string> {
    return fs.readFile(`./packages/backend/src/assets/emails/${templateName}.html`, 'utf-8')
}

type InvitationEmailTemplate = {
    templateName: 'invitation-email'
    data: {
        projectName: string
        setupLink: string
    }
}

type QuotaEmailTemplate = {
    templateName: 'quota-50' | 'quota-90' | 'quota-100'
    data: {
        resetDate: string
        firstName: string
    }
}

type VerifyEmailTemplate = {
    templateName: 'verify-email'
    data: {
        setupLink: string
    }
}

type ResetPasswordTemplate = {
    templateName: 'reset-password'
    data: {
        setupLink: string
        firstName: string
    }
}
type EmailTemplate =
    | InvitationEmailTemplate
    | QuotaEmailTemplate
    | VerifyEmailTemplate
    | ResetPasswordTemplate


type SendOtpEmailParams = {
    type: OtpType
    platformId: string | undefined | null
    otp: string
    user: User
}

