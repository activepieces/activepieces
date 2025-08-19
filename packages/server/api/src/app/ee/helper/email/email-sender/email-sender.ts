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
    issuesCount: string
    projectName: string
}>

type TriggerFailureThresholdTemplateData = BaseEmailTemplateData<'trigger-failure', {
    flowName: string
    projectName: string
}>

type ThreeDaysLeftOnTrialTemplateData = BaseEmailTemplateData<'3-days-left-on-trial', {
    year: string
    firstName: string
}>

type OneDayLeftOnTrialTemplateData = BaseEmailTemplateData<'1-day-left-on-trial', {
    year: string
    firstName: string
}>

type WelcomeToTrialTemplateData = BaseEmailTemplateData<'welcome-to-trial', {
    year: string
    firstName: string
}>

type SevenDaysInTrialTemplateData = BaseEmailTemplateData<'7-days-in-trial', {
    year: string
    firstName: string
}>

export type EmailTemplateData =
  | InvitationEmailTemplateData
  | QuotaEmailTemplateData
  | ResetPasswordEmailTemplateData
  | VerifyEmailTemplateData
  | IssueCreatedTemplateData
  | IssuesReminderTemplateData
  | TriggerFailureThresholdTemplateData
  | ThreeDaysLeftOnTrialTemplateData
  | OneDayLeftOnTrialTemplateData
  | WelcomeToTrialTemplateData
  | SevenDaysInTrialTemplateData

type SendArgs = {
    emails: string[]
    platformId: string | undefined
    templateData: EmailTemplateData
}
