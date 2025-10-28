import { readFile } from 'node:fs/promises'
import { AppSystemProp } from '@activepieces/server-shared'
import { ActivepiecesError, ApEdition, ApEnvironment, ErrorCode, isNil, Platform, SMTPInformation } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import Mustache from 'mustache'
import nodemailer, { Transporter } from 'nodemailer'
import { defaultTheme } from '../../../../flags/theme'
import { system } from '../../../../helper/system/system'
import { platformService } from '../../../../platform/platform.service'
import { EmailSender, EmailTemplateData } from './email-sender'



type SMTPEmailSender = EmailSender & {
    isSmtpConfigured: (platform: Platform | null) => boolean
    validateOrThrow: (smtp: SMTPInformation) => Promise<void>
}

export const smtpEmailSender = (log: FastifyBaseLogger): SMTPEmailSender => {
    return {
        async validateOrThrow(smtp: SMTPInformation) {
            const disableSmtpValidationInTesting = system.getOrThrow(AppSystemProp.ENVIRONMENT) === ApEnvironment.TESTING
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

            if (!smtpEmailSender(log).isSmtpConfigured(platform)) {
                log.error(`SMTP isn't configured for sending the email ${emailSubject}`)
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
        isSmtpConfigured(platform: Platform | null): boolean {
            const isConfigured = (host: string | undefined, port: string | undefined, user: string | undefined, password: string | undefined): boolean => {
                return !isNil(host) && !isNil(port) && !isNil(user) && !isNil(password)
            }

            const isPlatformSmtpConfigured = !isNil(platform) && !isNil(platform.smtp) && isConfigured(platform.smtp.host, platform?.smtp?.port?.toString(), platform.smtp.user, platform.smtp.password)
            const isSmtpSystemConfigured = isConfigured(system.get(AppSystemProp.SMTP_HOST), system.get(AppSystemProp.SMTP_PORT), system.get(AppSystemProp.SMTP_USERNAME), system.get(AppSystemProp.SMTP_PASSWORD))

            return isPlatformSmtpConfigured || isSmtpSystemConfigured
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
        renderIssues() {
            if (templateData.name === 'issues-summary') {
                return JSON.parse(templateData.vars.issues)
            }
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

const getEmailSubject = (templateName: EmailTemplateData['name'], vars: Record<string, string>): string => {
    const templateToSubject: Record<EmailTemplateData['name'], string> = {
        'invitation-email': 'You have been invited to a team',
        '3-days-left-on-trial': 'Unlock More with 10 Automation Templates',
        '1-day-left-on-trial': 'Your Plus Trial Ends Today - Upgrade ',
        '7-days-in-trial': '7 Days in – 15 Automation Ideas to Inspire You 🚀',
        'welcome-to-trial': 'Welcome to Activepieces + 4 Resources to Get Started ',
        'quota-50': '[ACTION REQUIRED] 50% of your Activepieces tasks are consumed',
        'quota-90': '[URGENT] 90% of your Activepieces tasks are consumed',
        'quota-100': '[URGENT] 100% of your Activepieces tasks are consumed',
        'verify-email': 'Verify your email address',
        'reset-password': 'Reset your password',
        'issue-created': `[ACTION REQUIRED] New issue in ${vars.flowName}`,
        'issues-summary': `Your issues summary for ${vars.projectName}`,
        'trigger-failure': `[ACTION REQUIRED] ${vars.flowName} trigger is failing`,
    }

    return templateToSubject[templateName]
}

type RenderEmailBodyArgs = {
    platform: Platform | null
    templateData: EmailTemplateData
}
