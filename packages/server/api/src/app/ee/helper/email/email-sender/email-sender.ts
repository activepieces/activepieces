import { ApEnvironment } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { system } from '../../../../helper/system/system'
import { AppSystemProp } from '../../../../helper/system/system-props'
import { logEmailSender } from './log-email-sender'
import { smtpEmailSender } from './smtp-email-sender'

export type EmailSender = {
    send: (args: SendArgs) => Promise<void>
}

const getEmailSenderInstance = (log: FastifyBaseLogger): EmailSender => {
    const env = system.get(AppSystemProp.ENVIRONMENT)

    // The automated test suite must never send real mail.
    if (env === ApEnvironment.TESTING) {
        return logEmailSender(log)
    }

    // Production always sends; any other environment (e.g. local dev) also sends once SMTP
    // is actually configured, so a deliberately-configured mail server really delivers. With
    // no SMTP configured we fall back to the log sender, preserving zero-setup dev behavior.
    if (env === ApEnvironment.PRODUCTION || smtpEmailSender(log).isSmtpConfigured()) {
        return smtpEmailSender(log)
    }

    return logEmailSender(log)
}
export const emailSender = (log: FastifyBaseLogger) => getEmailSenderInstance(log)

type BaseEmailTemplateData<Name extends string, Vars extends Record<string, string>> = {
    name: Name
    vars: Vars
}

type InvitationEmailTemplateData = BaseEmailTemplateData<'invitation-email', {
    projectName: string
    setupLink: string
}>

type ProjectMemberAddedEmailTemplateData = BaseEmailTemplateData<'project-member-added', {
    projectName: string
    role: string
    loginLink: string
}>

type ResetPasswordEmailTemplateData = BaseEmailTemplateData<'reset-password', {
    setupLink: string
}>

type VerifyEmailTemplateData = BaseEmailTemplateData<'verify-email', {
    setupLink: string
}>

type IssueCreatedTemplateData = BaseEmailTemplateData<'issue-created', {
    runUrl: string
    projectName: string
    flowName: string
    createdAt: string
    failedStepDisplayName: string
    failedStepNumber: string
    failedStepMessage: string
}>

type ScimUserWelcomeTemplateData = BaseEmailTemplateData<'scim-user-welcome', {
    loginLink: string
}>

type ChatNotificationTemplateData = BaseEmailTemplateData<'chat-notification', {
    subject: string
    body: string
    senderName: string
    senderEmail: string
}>

export type EmailTemplateData =
  | InvitationEmailTemplateData
  | ProjectMemberAddedEmailTemplateData
  | ResetPasswordEmailTemplateData
  | VerifyEmailTemplateData
  | IssueCreatedTemplateData
  | ScimUserWelcomeTemplateData
  | ChatNotificationTemplateData

type SendArgs = {
    emails: string[]
    platformId: string | undefined
    templateData: EmailTemplateData
    replyTo?: string
}
