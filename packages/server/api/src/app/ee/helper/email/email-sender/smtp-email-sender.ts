import { readFile } from 'node:fs/promises'
import Mustache from 'mustache'
import nodemailer, { Transporter } from 'nodemailer'
import { defaultTheme } from '../../../../flags/theme'
import { platformService } from '../../../../platform/platform.service'
import { EmailSender, EmailTemplateData } from './email-sender'
import { system, SystemProp } from '@activepieces/server-shared'
import { isNil, Platform } from '@activepieces/shared'

/**
 * Sends emails using SMTP
 */
export const smtpEmailSender: EmailSender = {
    async send({ emails, platformId, templateData }) {
        const platform = await getPlatform(platformId)
        const emailSubject = getEmailSubject(templateData.name, templateData.vars)
        const senderName = platform?.name ?? system.get(SystemProp.SMTP_SENDER_NAME)
        const senderEmail = platform?.smtpSenderEmail ?? system.get(SystemProp.SMTP_SENDER_EMAIL)

        if (!isSmtpConfigured(platform)) {
            return
        }

        const emailBody = await renderEmailBody({
            platform,
            templateData,
        })

        const smtpClient = initSmtpClient(platform)

        await smtpClient.sendMail({
            from: `${senderName} <${senderEmail}>`,
            to: emails.join(','),
            subject: emailSubject,
            html: emailBody,
        })
    },
}


const isSmtpConfigured = (platform: Platform | null): boolean => {
    const isConfigured = (host: string | undefined, port: string | undefined, user: string | undefined, password: string | undefined): boolean => {
        return !isNil(host) && !isNil(port) && !isNil(user) && !isNil(password)
    }

    const isPlatformSmtpConfigured = platform && isConfigured(platform.smtpHost, platform.smtpPort?.toString(), platform.smtpUser, platform.smtpPassword)
    const isSmtpSystemConfigured = isConfigured(system.get(SystemProp.SMTP_HOST), system.get(SystemProp.SMTP_PORT), system.get(SystemProp.SMTP_USERNAME), system.get(SystemProp.SMTP_PASSWORD))

    return isPlatformSmtpConfigured || isSmtpSystemConfigured
}

const getPlatform = async (platformId: string | undefined): Promise<Platform | null> => {
    return platformId ? platformService.getOne(platformId) : null
}

const renderEmailBody = async ({ platform, templateData }: RenderEmailBodyArgs): Promise<string> => {
    const templatePath = `packages/server/api/src/assets/emails/${templateData.name}.html`
    const template = await readFile(templatePath, 'utf-8')

    const primaryColor = platform?.primaryColor ?? defaultTheme.colors.primary.default
    const fullLogoUrl = platform?.fullLogoUrl ?? defaultTheme.logos.fullLogoUrl
    const platformName = platform?.name ?? defaultTheme.websiteName

    return Mustache.render(template, {
        ...templateData.vars,
        primaryColor,
        fullLogoUrl,
        platformName,
    })
}

const initSmtpClient = (platform: Platform | null): Transporter => {
    return nodemailer.createTransport({
        host: platform?.smtpHost ?? system.getOrThrow(SystemProp.SMTP_HOST),
        port: platform?.smtpPort ?? Number.parseInt(system.getOrThrow(SystemProp.SMTP_PORT)),
        secure: platform?.smtpUseSSL ?? system.getBoolean(SystemProp.SMTP_USE_SSL),
        auth: {
            user: platform?.smtpUser ?? system.getOrThrow(SystemProp.SMTP_USERNAME),
            pass: platform?.smtpPassword ?? system.getOrThrow(SystemProp.SMTP_PASSWORD),
        },
    })
}

const getEmailSubject = (templateName: EmailTemplateData['name'], vars: Record<string, string>): string => {
    const templateToSubject: Record<EmailTemplateData['name'], string> = {
        'invitation-email': 'You have been invited to a team',
        'quota-50': '[ACTION REQUIRED] 50% of your Activepieces tasks are consumed',
        'quota-90': '[URGENT] 90% of your Activepieces tasks are consumed',
        'quota-100': '[URGENT] 100% of your Activepieces tasks are consumed',
        'verify-email': 'Verify your email address',
        'reset-password': 'Reset your password',
        'issue-created': `[ACTION REQUIRED] New issue in ${vars.flowName}`,
    }

    return templateToSubject[templateName]
}

type RenderEmailBodyArgs = {
    platform: Platform | null
    templateData: EmailTemplateData
}
