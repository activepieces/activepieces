import { readFile } from 'node:fs/promises'
import { AppSystemProp } from '@activepieces/server-shared'
import { ActivepiecesError, ApEdition, ApEnvironment, ErrorCode, isNil, Platform } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import Mustache from 'mustache'
import nodemailer, { Transporter } from 'nodemailer'
import { defaultTheme } from '../../../../flags/theme'
import { system } from '../../../../helper/system/system'
import { platformService } from '../../../../platform/platform.service'
import { EmailSender, EmailTemplateData } from './email-sender'

export type SMTPEmailSender = EmailSender & {
    validateOrThrow(): Promise<void>
    isSmtpConfigured(): boolean
}

export const smtpEmailSender = (log: FastifyBaseLogger): SMTPEmailSender => {
    return {
        async validateOrThrow() {
            if (system.getOrThrow(AppSystemProp.ENVIRONMENT) !== ApEnvironment.PRODUCTION) {
                return
            }
            const smtpClient = initSmtpClient()
            try {
                await smtpClient.verify()
            }
            catch (e) {
                throw new ActivepiecesError({
                    code: ErrorCode.INVALID_SMTP_CREDENTIALS,
                    params: { message: String(e) },
                })
            }
        },
        async send({ emails, platformId, templateData }) {
            const platform = await getPlatform(platformId)
            const emailSubject = getEmailSubject(templateData.name, templateData.vars)
            const senderName = system.get(AppSystemProp.SMTP_SENDER_NAME)
            const senderEmail = system.get(AppSystemProp.SMTP_SENDER_EMAIL)

            if (!smtpEmailSender(log).isSmtpConfigured()) {
                log.error(`SMTP isn't configured for sending the email ${emailSubject}`)
                return
            }

            const emailBody = await renderEmailBody({
                platform,
                templateData,
            })

            const smtpClient = initSmtpClient()
            await smtpClient.sendMail({
                from: `${senderName} <${senderEmail}>`,
                to: emails.join(','),
                subject: emailSubject,
                html: emailBody,
            })
        },

        isSmtpConfigured(): boolean {
            return [AppSystemProp.SMTP_HOST, AppSystemProp.SMTP_PORT, AppSystemProp.SMTP_USERNAME, AppSystemProp.SMTP_PASSWORD]
                .every(prop => !isNil(system.get(prop)))
        },
    }
}

const getPlatform = async (platformId: string | undefined): Promise<Platform | null> => {
    return platformId ? platformService.getOne(platformId) : null
}

const renderEmailBody = async ({ platform, templateData }: RenderEmailBodyArgs): Promise<string> => {
    const templatePath = `packages/server/api/src/assets/emails/${templateData.name}.html`
    const footerPath = 'packages/server/api/src/assets/emails/footer.html'
    const template = await readFile(templatePath, 'utf-8')
    const footer = await readFile(footerPath, 'utf-8')
    const edition = system.getEdition()
    const primaryColor = platform?.primaryColor ?? defaultTheme.colors.primary.default
    const fullLogoUrl = platform?.fullLogoUrl ?? defaultTheme.logos.fullLogoUrl
    const platformName = platform?.name ?? defaultTheme.websiteName

    return Mustache.render(template, {
        ...templateData.vars,
        primaryColor,
        fullLogoUrl,
        platformName,
        checkIssuesEnabled() {
            return templateData.name === 'issue-created' && templateData.vars.isIssue === 'true'
        },
        footerContent() {
            return edition === ApEdition.CLOUD ? `   Activepieces, Inc. 398 11th Street,
                    2nd floor, San Francisco, CA 94103` : `${platform?.name} Team.`
        },
    },
    {
        footer,
    },
    )
}

const initSmtpClient = (): Transporter => {
    const smtpPort = Number.parseInt(system.getOrThrow(AppSystemProp.SMTP_PORT))
    return nodemailer.createTransport({
        host: system.getOrThrow(AppSystemProp.SMTP_HOST),
        port: smtpPort,
        secure: smtpPort === 465,
        auth: {
            user: system.getOrThrow(AppSystemProp.SMTP_USERNAME),
            pass: system.getOrThrow(AppSystemProp.SMTP_PASSWORD),
        },
    })
}

const getEmailSubject = (templateName: EmailTemplateData['name'], vars: Record<string, string>): string => {
    const templateToSubject: Record<EmailTemplateData['name'], string> = {
        'invitation-email': 'You have been invited to a team',
        'verify-email': 'Verify your email address',
        'reset-password': 'Reset your password',
        'issue-created': `[ACTION REQUIRED] New issue in ${vars.flowName}`,
        'trigger-failure': `[ACTION REQUIRED] ${vars.flowName} trigger is failing`,
    }

    return templateToSubject[templateName]
}

type RenderEmailBodyArgs = {
    platform: Platform | null
    templateData: EmailTemplateData
}
