import { createAction, Property } from '@activepieces/pieces-framework'
import { HttpMethod, AuthenticationType, httpClient } from '@activepieces/pieces-common'
import { emailitAuth } from '../auth'

export const sendEmailAction = createAction({
    auth: emailitAuth,
    name: 'send_email',
    displayName: 'Send Email',
    description: 'Send an email to one or more recipients via Emailit.',
    props: {
        to: Property.Array({
            displayName: 'To',
            description: 'Recipient email addresses. Up to 50 total across To, CC, and BCC.',
            required: true,
        }),
        from_name: Property.ShortText({
            displayName: 'Sender Name',
            description: 'Name recipients will see in their inbox, e.g. "Acme Support". If left blank, only the email address is shown.',
            required: false,
        }),
        from_email: Property.ShortText({
            displayName: 'Sender Email',
            description: 'Email address to send from. Must be verified in your Emailit account.',
            required: true,
        }),
        cc: Property.Array({
            displayName: 'CC',
            description: 'Send a visible copy to these addresses.',
            required: false,
        }),
        bcc: Property.Array({
            displayName: 'BCC',
            description: "Send a hidden copy to these addresses. Other recipients won't see them.",
            required: false,
        }),
        reply_to: Property.ShortText({
            displayName: 'Reply-To',
            description: 'Where replies go. Defaults to the sender email if left blank.',
            required: false,
        }),
        subject: Property.ShortText({
            displayName: 'Subject',
            description: "The subject line shown in the recipient's inbox.",
            required: true,
        }),
        content_type: Property.StaticDropdown<'text' | 'html'>({
            displayName: 'Content Type',
            required: true,
            defaultValue: 'html',
            options: {
                disabled: false,
                options: [
                    { label: 'Plain Text', value: 'text' },
                    { label: 'HTML', value: 'html' },
                ],
            },
        }),
        content: Property.LongText({
            displayName: 'Email Body',
            description:
                'The message body. Use Plain Text for simple messages or HTML for rich formatting.',
            required: true,
        }),
        headers: Property.Object({
            displayName: 'Custom Headers',
            description: 'Add custom email headers as key-value pairs, e.g. X-Campaign-ID: welcome.',
            required: false,
        }),
    },
    async run(context) {
        const {
            to,
            from_name,
            from_email,
            cc,
            bcc,
            reply_to,
            subject,
            content_type,
            content,
            headers,
        } = context.propsValue

        const requestBody: Record<string, unknown> = {
            from: from_name ? `${from_name} <${from_email}>` : from_email,
            to: to,
            subject: subject,
        }

        if (content_type === 'text') {
            requestBody['text'] = content
        } else {
            requestBody['html'] = content
        }

        if (cc && cc.length > 0) {
            requestBody['cc'] = cc
        }

        if (bcc && bcc.length > 0) {
            requestBody['bcc'] = bcc
        }

        if (reply_to) {
            requestBody['reply_to'] = reply_to
        }

        if (headers && Object.keys(headers).length > 0) {
            requestBody['headers'] = headers
        }

        return await httpClient.sendRequest({
            method: HttpMethod.POST,
            url: 'https://api.emailit.com/v2/emails',
            body: requestBody,
            authentication: {
                type: AuthenticationType.BEARER_TOKEN,
                token: context.auth.secret_text,
            },
        })
    },
})
