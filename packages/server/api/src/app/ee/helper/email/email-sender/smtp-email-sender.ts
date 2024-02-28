import { readFile } from 'node:fs/promises'
import Mustache from 'mustache'
import nodemailer, { Transporter } from 'nodemailer'
import { Platform } from '@activepieces/shared'
import { SystemProp, system } from 'server-shared'
import { EmailSender, EmailTemplateData } from './email-sender'
import { defaultTheme } from '../../../../flags/theme'
import { platformService } from '../../../../platform/platform.service'

/**
 * Sends emails using SMTP
 */
export const smtpEmailSender: EmailSender = {
    async send({ email, platformId, templateData }) {
        const platform = await getPlatform(platformId)
        const emailSubject = getEmailSubject(templateData.name)
        const senderName = platform?.name ?? system.get(SystemProp.SMTP_SENDER_NAME)
        const senderEmail = platform?.smtpSenderEmail ?? system.get(SystemProp.SMTP_SENDER_EMAIL)

        const emailBody = await renderEmailBody({
            platform,
            templateData,
        })

        const smtpClient = initSmtpClient(platform)

        await smtpClient.sendMail({
            from: `${senderName} <${senderEmail}>`,
            to: email,
            subject: emailSubject,
            html: emailBody,
        })
    },
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

const getEmailSubject = (templateName: EmailTemplateData['name']): string => {
    const templateToSubject: Record<EmailTemplateData['name'], string> = {
        'invitation-email': 'You have been invited to a team',
        'quota-50': '[ACTION REQUIRED] 50% of your Activepieces tasks are consumed',
        'quota-90': '[URGENT] 90% of your Activepieces tasks are consumed',
        'quota-100': '[URGENT] 100% of your Activepieces tasks are consumed',
        'verify-email': 'Verify your email address',
        'reset-password': 'Reset your password',
    }

    return templateToSubject[templateName]
}

type RenderEmailBodyArgs = {
    platform: Platform | null
    templateData: EmailTemplateData
}
