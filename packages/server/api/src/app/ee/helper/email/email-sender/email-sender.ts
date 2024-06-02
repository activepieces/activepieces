import { logEmailSender } from './log-email-sender'
import { smtpEmailSender } from './smtp-email-sender'
import { system, SystemProp } from '@activepieces/server-shared'
import { ApEnvironment } from '@activepieces/shared'

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
    projectName: string
    setupLink: string
}>

type QuotaEmailTemplateData = BaseEmailTemplateData<'quota-50' | 'quota-90' | 'quota-100', {
    resetDate: string
    firstName: string
}>

type ResetPasswordEmailTemplateData = BaseEmailTemplateData<'reset-password', {
    setupLink: string
    firstName: string
}>

type VerifyEmailTemplateData = BaseEmailTemplateData<'verify-email', {
    setupLink: string
}>

type IssueCreatedTemplateData = BaseEmailTemplateData<'issue-created', {
    issueUrl: string
    flowName: string
    count: string
    createdAt: string
}>

export type EmailTemplateData =
  | InvitationEmailTemplateData
  | QuotaEmailTemplateData
  | ResetPasswordEmailTemplateData
  | VerifyEmailTemplateData
  | IssueCreatedTemplateData

type SendArgs = {
    emails: string[]
    platformId: string | undefined
    templateData: EmailTemplateData
}
