type BaseEmailTemplateData<Name extends string, Vars extends Record<string, string>> = {
    name: Name
    vars: Vars
}

type InvitationEmailTemplateData = BaseEmailTemplateData<'invitation-email', {
    projectOrPlatformName: string
    invitationLink: string
}>

export type EmailTemplateData = InvitationEmailTemplateData

export type SendEmailParams = {
    emails: string[]
    platformId?: string
    templateData: EmailTemplateData
}

export type EmailSender = {
    send: (args: SendEmailParams) => Promise<void>
}
