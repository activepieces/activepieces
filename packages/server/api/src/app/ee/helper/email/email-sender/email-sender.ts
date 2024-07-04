import { system, SystemProp } from '@activepieces/server-shared'
import { ApEnvironment } from '@activepieces/shared'
import { logEmailSender } from './log-email-sender'
import { smtpEmailSender } from './smtp-email-sender'

export type EmailSender = {
    send: (args: SendArgs) => Promise<void>
}

const getEmailSenderInstance = (): EmailSender => {
    const env = system.get(SystemProp.ENVIRONMENT)

    if (env === ApEnvironment.PRODUCTION) {
        return smtpEmailSender
    }

    return logEmailSender
}

export const emailSender = getEmailSenderInstance()

type BaseEmailTemplateData<Name extends string, Vars extends Record<string, string>> = {
    name: Name
    vars: Vars
}

type InvitationEmailTemplateData = BaseEmailTemplateData<'invitation-email', {
    projectOrPlatformName: string
    role: string
    setupLink: string
}>

type QuotaEmailTemplateData = BaseEmailTemplateData<'quota-50' | 'quota-90' | 'quota-100', {
    resetDate: string
}>

type ResetPasswordEmailTemplateData = BaseEmailTemplateData<'reset-password', {
    setupLink: string
}>

type VerifyEmailTemplateData = BaseEmailTemplateData<'verify-email', {
    setupLink: string
}>

type IssueCreatedTemplateData = BaseEmailTemplateData<'issue-created', {
    issueUrl: string
    flowName: string
    isIssue: string
    createdAt: string
}>

type IssuesReminderTemplateData = BaseEmailTemplateData<'issues-reminder', {
    issuesUrl: string
    issues: string
    projectName: string
}>

export type EmailTemplateData =
  | InvitationEmailTemplateData
  | QuotaEmailTemplateData
  | ResetPasswordEmailTemplateData
  | VerifyEmailTemplateData
  | IssueCreatedTemplateData
  | IssuesReminderTemplateData

type SendArgs = {
    emails: string[]
    platformId: string | undefined
    templateData: EmailTemplateData
}
