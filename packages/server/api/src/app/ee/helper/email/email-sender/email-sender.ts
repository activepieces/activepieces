import { AppSystemProp } from '@activepieces/server-shared'
import { ApEnvironment } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { system } from '../../../../helper/system/system'
import { logEmailSender } from './log-email-sender'
import { smtpEmailSender } from './smtp-email-sender'

export type EmailSender = {
    send: (args: SendArgs) => Promise<void>
}

const getEmailSenderInstance = (log: FastifyBaseLogger): EmailSender => {
    const env = system.get(AppSystemProp.ENVIRONMENT)

    if (env === ApEnvironment.PRODUCTION) {
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
    projectOrPlatformName: string
    role: string
    setupLink: string
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

type TriggerFailureThresholdTemplateData = BaseEmailTemplateData<'trigger-failure', {
    flowName: string
    projectName: string
}>

export type EmailTemplateData =
  | InvitationEmailTemplateData
  | ResetPasswordEmailTemplateData
  | VerifyEmailTemplateData
  | IssueCreatedTemplateData
  | TriggerFailureThresholdTemplateData

type SendArgs = {
    emails: string[]
    platformId: string | undefined
    templateData: EmailTemplateData
}
