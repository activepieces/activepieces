import { readFile } from 'node:fs/promises'
import { AppSystemProp } from '@activepieces/server-shared'
import { EmailSender, EmailTemplateData, isNil, Platform, SMTPInformation } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import Mustache from 'mustache'
import nodemailer, { Transporter } from 'nodemailer'
import { defaultTheme } from '../../flags/theme'
import { system } from '../../helper/system/system'
import { platformService } from '../../platform/platform.service'


type SMTPEmailSender = EmailSender & {
    isSystemSmtpConfigured: () => boolean
}

export const smtpEmailSender = (log: FastifyBaseLogger): SMTPEmailSender => {
    return {
        async send({ emails, platformId, templateData }): Promise<void> {
            if (!smtpEmailSender(log).isSystemSmtpConfigured()) {
                log.error('SMTP is not configured for sending emails')
                return
            }

            const platform = await getPlatform(platformId)
            const emailSubject = getEmailSubject(templateData.name, templateData.vars)
            const senderName = platform?.smtp?.senderName ?? system.get(AppSystemProp.SMTP_SENDER_NAME)
            const senderEmail = platform?.smtp?.senderEmail ?? system.get(AppSystemProp.SMTP_SENDER_EMAIL)

            const emailBody = await renderEmailBody({
                platform,
                templateData,
            })

            const smtpClient = initSmtpClient(platform?.smtp)

            await smtpClient.sendMail({
                from: `${senderName} <${senderEmail}>`,
                to: emails.join(','),
                subject: emailSubject,
                html: emailBody,
            })
        },
        isSystemSmtpConfigured(): boolean {
            return !isNil(system.get(AppSystemProp.SMTP_HOST)) && !isNil(system.get(AppSystemProp.SMTP_PORT)) && !isNil(system.get(AppSystemProp.SMTP_USERNAME)) && !isNil(system.get(AppSystemProp.SMTP_PASSWORD))
        },
    }
}

const getPlatform = async (platformId: string | undefined): Promise<Platform | null> => {
    return platformId ? platformService.getOne(platformId) : null
}

const renderEmailBody = async ({ platform, templateData }: RenderEmailBodyArgs): Promise<string> => {
    const templatePath = `packages/server/api/src/assets/emails/promptx/${templateData.name}.html`
    const template = await readFile(templatePath, 'utf-8')
    const primaryColor = platform?.primaryColor ?? defaultTheme.colors.primary.default
    const fullLogoUrl = platform?.fullLogoUrl ?? defaultTheme.logos.fullLogoUrl
    const platformName = platform?.name ?? defaultTheme.websiteName

    return Mustache.render(template, {
        ...templateData.vars,
        primaryColor,
        fullLogoUrl,
        platformName,
    },
    )
}

const initSmtpClient = (smtp: SMTPInformation | undefined | null): Transporter => {
    const smtpPort = smtp?.port ?? Number.parseInt(system.getOrThrow(AppSystemProp.SMTP_PORT))
    return nodemailer.createTransport({
        host: smtp?.host ?? system.getOrThrow(AppSystemProp.SMTP_HOST),
        port: smtpPort,
        secure: smtpPort === 465,
        auth: {
            user: smtp?.user ?? system.getOrThrow(AppSystemProp.SMTP_USERNAME),
            pass: smtp?.password ?? system.getOrThrow(AppSystemProp.SMTP_PASSWORD),
        },
    })
}

const getEmailSubject = (templateName: EmailTemplateData['name'], _vars: Record<string, string>): string => {
    const templateToSubject: Record<EmailTemplateData['name'], string> = {
        'invitation-email': 'You have been invited to a project',
    }

    return templateToSubject[templateName]
}

type RenderEmailBodyArgs = {
    platform: Platform | null
    templateData: EmailTemplateData
}
