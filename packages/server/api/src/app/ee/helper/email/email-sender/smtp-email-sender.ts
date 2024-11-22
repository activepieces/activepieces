import { readFile } from 'node:fs/promises'
import { AppSystemProp, logger, SharedSystemProp, system } from '@activepieces/server-shared'
import { ActivepiecesError, ApEnvironment, ErrorCode, isNil, Platform, SMTPInformation } from '@activepieces/shared'
import Mustache from 'mustache'
import nodemailer, { Transporter } from 'nodemailer'
import { defaultTheme } from '../../../../flags/theme'
import { platformService } from '../../../../platform/platform.service'
import { EmailSender, EmailTemplateData } from './email-sender'

const isSmtpConfigured = (platform: Platform | null): boolean => {
    const isConfigured = (host: string | undefined, port: string | undefined, user: string | undefined, password: string | undefined): boolean => {
        return !isNil(host) && !isNil(port) && !isNil(user) && !isNil(password)
    }

    const isPlatformSmtpConfigured = !isNil(platform) && !isNil(platform.smtp)
    const isSmtpSystemConfigured = isConfigured(system.get(AppSystemProp.SMTP_HOST), system.get(AppSystemProp.SMTP_PORT), system.get(AppSystemProp.SMTP_USERNAME), system.get(AppSystemProp.SMTP_PASSWORD))

    return isPlatformSmtpConfigured || isSmtpSystemConfigured
}


type SMTPEmailSender = EmailSender & {
    isSmtpConfigured: (platform: Platform | null) => boolean
    validateOrThrow: (smtp: SMTPInformation) => Promise<void>
}

export const smtpEmailSender: SMTPEmailSender = {
    async validateOrThrow(smtp: SMTPInformation) {
        const disableSmtpValidationInTesting = system.getOrThrow(SharedSystemProp.ENVIRONMENT) === ApEnvironment.TESTING
        if (disableSmtpValidationInTesting) {
            return
        }
        const smtpClient = initSmtpClient(smtp)
        try {
            await smtpClient.verify()
        }
        catch (e) {
            throw new ActivepiecesError({
                code: ErrorCode.INVALID_SMTP_CREDENTIALS,
                params: {
                    message: JSON.stringify(e),
                },
            })
        }
    },
    async send({ emails, platformId, templateData }) {
        const platform = await getPlatform(platformId)
        const emailSubject = getEmailSubject(templateData.name, templateData.vars)
        const senderName = platform?.smtp?.senderName ?? system.get(AppSystemProp.SMTP_SENDER_NAME)
        const senderEmail = platform?.smtp?.senderEmail ?? system.get(AppSystemProp.SMTP_SENDER_EMAIL)

        if (!isSmtpConfigured(platform)) {
            logger.error(`SMTP isn't configured for sending the email ${emailSubject}`)
            return
        }

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
    isSmtpConfigured,
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
        checkIssuesEnabled() {
            return templateData.name === 'issue-created' && templateData.vars.isIssue === 'true'
        },
        renderIssues() {
            if (templateData.name === 'issues-reminder') {
                return JSON.parse(templateData.vars.issues)
            }
        },
    })
}

const initSmtpClient = (smtp: SMTPInformation | undefined): Transporter => {
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

const getEmailSubject = (templateName: EmailTemplateData['name'], vars: Record<string, string>): string => {
    const templateToSubject: Record<EmailTemplateData['name'], string> = {
        'invitation-email': 'You have been invited to a team',
        'quota-50': '[ACTION REQUIRED] 50% of your Activepieces tasks are consumed',
        'quota-90': '[URGENT] 90% of your Activepieces tasks are consumed',
        'quota-100': '[URGENT] 100% of your Activepieces tasks are consumed',
        'verify-email': 'Verify your email address',
        'reset-password': 'Reset your password',
        'issue-created': `[ACTION REQUIRED] New issue in ${vars.flowName}`,
        'issues-reminder': `You have unresolved issues for ${vars.projectName}`,
        'trigger-failure': `[ACTION REQUIRED] ${vars.flowName} trigger is failing`,
    }

    return templateToSubject[templateName]
}

type RenderEmailBodyArgs = {
    platform: Platform | null
    templateData: EmailTemplateData
}
