import { accessTokenManager } from '../../../authentication/lib/access-token-manager'
import { getEdition } from '../../../helper/secret-helper'
import { ApEdition, Principal, assertNotNullOrUndefined, isNil } from '@activepieces/shared'
import fs from 'node:fs/promises'
import Mustache from 'mustache'
import nodemailer from 'nodemailer'

import { platformService } from '../../platform/platform.service'
import { defaultTheme } from '../../../flags/theme'
import { projectService } from '../../../project/project-service'
import { system } from '../../../helper/system/system'
import { SystemProp } from '../../../helper/system/system-prop'
import { Platform } from '@activepieces/ee-shared'
import { customDomainService } from '../../custom-domains/custom-domain.service'

export const emailService = {
    async sendInvitation({ email, invitationId, projectId }: { email: string, invitationId: string, projectId: string }): Promise<void> {
        const edition = getEdition()
        if (![ApEdition.CLOUD, ApEdition.ENTERPRISE].includes(edition)) {
            return
        }
        const project = await projectService.getOne(projectId)
        assertNotNullOrUndefined(project, 'project')
        const domain = await getFrontendDomain(edition, project.platformId)

        const token = await accessTokenManager.generateToken({
            id: invitationId,
        } as Principal)
        await sendEmail({
            email,
            platformId: project.platformId,
            template: {
                templateName: 'invitation-email',
                data: {
                    setupLink: `${domain}invitation?token=${token}&email=${encodeURIComponent(email)}`,
                    projectName: project.displayName,
                },
            },
        })
    },
    async sendQuotaAlert({ email, projectId, resetDate, firstName, templateId }: { email: string, projectId: string, resetDate: string, firstName: string, templateId: 'quota-50' | 'quota-90' | 'quota-100' }): Promise<void> {
        const edition = getEdition()
        if (![ApEdition.CLOUD].includes(edition)) {
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
}


async function getFrontendDomain(edition: ApEdition, platformId: string | undefined): Promise<string> {
    let domain = system.get(SystemProp.FRONTEND_URL)
    if (edition === ApEdition.CLOUD && platformId) {
        const customDomain = await customDomainService.getOneByPlatform({
            platformId,
        })
        if (customDomain) {
            domain = `https://${customDomain.domain}/`
        }
    }
    return domain + (domain?.endsWith('/') ? '' : '/')
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
    }

    await transporter.sendMail({
        from: `${platform?.name ?? 'Activepieces'} <${platform?.smtpSenderEmail ?? 'notifications@activepieces.com'}>`,
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
    return await fs.readFile(`./packages/backend/src/assets/emails/${templateName}.html`, 'utf-8')
}

type EmailTemplate = {
    templateName: 'invitation-email'
    data: {
        projectName: string
        setupLink: string
    }
} | {
    templateName: 'quota-50' | 'quota-90' | 'quota-100'
    data: {
        resetDate: string
        firstName: string
    }
}