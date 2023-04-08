import { createAction } from '@activepieces/framework';
import { Property } from '@activepieces/framework';
import nodemailer from 'nodemailer';

export const sendEmail = createAction({
    name: 'send-email',
    displayName: 'Send Email',
    description: 'Send an email using a custom SMTP server.',
    props: {
        authentication: Property.CustomAuth({
            displayName: 'Authentication',
            required: true,
            props: {
                host: Property.ShortText({
                    displayName: 'Host',
                    required: true,
                }),
                email: Property.ShortText({
                    displayName: 'Email',
                    required: true,
                }),
                password: Property.SecretText({
                    displayName: 'Password',
                    required: true,
                }),
                port: Property.ShortText({
                    displayName: 'Port',
                    required: true,
                }),
                TLS: Property.Checkbox({
                    displayName: 'Use TLS',
                    defaultValue: false,
                    required: true,
                }),
            },
        }),
        from: Property.ShortText({
            displayName: 'From',
            required: true,
        }),
        to: Property.Array({
            displayName: 'To',
            required: true,
        }),
        cc: Property.Array({
            displayName: 'CC',
            required: false,
        }),
        replyTo: Property.ShortText({
            displayName: 'Reply To',
            required: false,
        }),
        bcc: Property.Array({
            displayName: 'BCC',
            required: false,
        }),
        subject: Property.ShortText({
            displayName: 'Subject',
            required: true,
        }),
        body: Property.LongText({
            displayName: 'Body',
            required: true,
        }),
    },
    run: async ({ propsValue }) => {
        const transporter = nodemailer.createTransport({
            host: propsValue.authentication.host,
            port: +propsValue.authentication.port,
            auth: {
                user: propsValue.authentication.email,
                pass: propsValue.authentication.password,
            },
            secure: propsValue.authentication.TLS,
        });

        const info = await transporter.sendMail({
            from: propsValue.from,
            to: propsValue.to.join(','),
            cc: propsValue.cc?.join(','),
            inReplyTo: propsValue.replyTo,
            bcc: propsValue.bcc?.join(','),
            subject: propsValue.subject,
            text: propsValue.body,
        });

        return info;
    },
});