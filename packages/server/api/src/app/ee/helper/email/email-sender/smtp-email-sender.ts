import { readFile } from 'node:fs/promises'
import { ActivepiecesError, ApEdition, ApEnvironment, ErrorCode, isNil, Platform } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import Mustache from 'mustache'
import nodemailer, { Transporter } from 'nodemailer'
import { defaultTheme } from '../../../../flags/theme'
import { system } from '../../../../helper/system/system'
import { AppSystemProp } from '../../../../helper/system/system-props'
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
            try {
                const platform = await getPlatform(platformId, log)
                const emailSubject = getEmailSubject(templateData.name, templateData.vars)
                const senderName = system.get(AppSystemProp.SMTP_SENDER_NAME)
                const senderEmail = system.get(AppSystemProp.SMTP_SENDER_EMAIL)
    
                if (!smtpEmailSender(log).isSmtpConfigured()) {
                    log.error({ emailSubject }, '[smtpEmailSender#send] SMTP is not configured')
                    return
                }
    
                const emailBody = await renderEmailBody({
                    platform,
                    templateData,
                })
    
                const smtpClient = initSmtpClient()
                log.info({
                    emails,
                    platformId,
                    templateData,
                }, '[smtpEmailSender#send] sending email')
                await smtpClient.sendMail({
                    from: `${senderName} <${senderEmail}>`,
                    to: emails.join(','),
                    subject: emailSubject,
                    html: emailBody,
                })
            }
            catch (e) {
                log.error({
                    error: e,
                    emails,
                    platformId,
                    title: templateData.name,
                }, '[smtpEmailSender#send] error sending email')
                throw e
            }
          
        },

        isSmtpConfigured(): boolean {
            return [AppSystemProp.SMTP_HOST, AppSystemProp.SMTP_PORT, AppSystemProp.SMTP_USERNAME, AppSystemProp.SMTP_PASSWORD]
                .every(prop => !isNil(system.get(prop)))
        },
    }
}

const getPlatform = async (platformId: string | undefined, log: FastifyBaseLogger): Promise<Platform | null> => {
    return platformId ? platformService(log).getOne(platformId) : null
}

const renderEmailBody = async ({ platform, templateData }: RenderEmailBodyArgs): Promise<string> => {
    const templatePath = `packages/server/api/src/assets/emails/${templateData.name}.html`
    const footerPath = 'packages/server/api/src/assets/emails/footer.html'
    const template = await readFile(templatePath, 'utf-8')
    const footer = await readFile(footerPath, 'utf-8')
    const edition = system.getEdition()
    const primaryColor = platform?.primaryColor ?? defaultTheme.colors.primary.default
    const primaryColorLight = hexToLightTint({ hex: primaryColor, opacity: 0.08 })
    const fullLogoUrl = platform?.fullLogoUrl ?? defaultTheme.logos.fullLogoUrl
    const platformName = platform?.name ?? defaultTheme.websiteName

    return Mustache.render(template, {
        ...templateData.vars,
        primaryColor,
        primaryColorLight,
        fullLogoUrl,
        platformName,
        checkIssuesEnabled() {
            return templateData.name === 'issue-created' && templateData.vars.isIssue === 'true'
        },
        footerContent: edition === ApEdition.CLOUD ? 'Activepieces, Inc. 398 11th Street, 2nd floor, San Francisco, CA 94103' : '',
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
        'invitation-email': `You have been invited to "${vars.projectName}" project ✉️`,
        'project-member-added': `Welcome to ${vars.projectName} 🎉`,
        'badge-awarded': 'Congratulations, you earned a new badge! 🎉',
        'verify-email': 'Verify your email address ✅',
        'reset-password': 'Reset your password 🔑',
        'issue-created': `Flow has an issue "${vars.flowName}" ⚠️`,
        'scim-user-welcome': 'Welcome! Your account has been created 🎉',
    }

    return templateToSubject[templateName]
}

const hexToLightTint = ({ hex, opacity }: { hex: string, opacity: number }): string => {
    let raw = hex.replace('#', '')
    if (raw.length === 3) {
        raw = raw[0] + raw[0] + raw[1] + raw[1] + raw[2] + raw[2]
    }
    if (raw.length !== 6) {
        return '#ffffff'
    }
    const r = Math.round(255 - (255 - parseInt(raw.substring(0, 2), 16)) * opacity)
    const g = Math.round(255 - (255 - parseInt(raw.substring(2, 4), 16)) * opacity)
    const b = Math.round(255 - (255 - parseInt(raw.substring(4, 6), 16)) * opacity)
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
}

type RenderEmailBodyArgs = {
    platform: Platform | null
    templateData: EmailTemplateData
}
