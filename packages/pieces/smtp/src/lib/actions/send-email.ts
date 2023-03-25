import { createAction } from '@activepieces/framework';
import { HttpMethod } from '@activepieces/framework';
import { httpClient } from '@activepieces/framework';
import { Property } from '@activepieces/framework';
import nodemailer from 'nodemailer';

export const sendEmail = createAction({
    name: 'send-email',
    displayName: 'Send Email',
    description: 'Send an email, duhh',
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
            required: true,
        }),
        from: Property.ShortText({
            displayName: 'From',
            required: true,
        }),
        to: Property.ShortText({
            displayName: 'To',
            required: true,
        }),
        cc: Property.ShortText({
            displayName: 'CC',
            required: false,
        }),
        replyTo: Property.ShortText({
            displayName: 'Reply To',
            required: false,
        }),
        bcc: Property.ShortText({
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
            host: propsValue.host,
            port: +propsValue.port,
            auth: {
                user: propsValue.email,
                pass: propsValue.password,
            },
            secure: propsValue.TLS,
        });

        const info = await transporter.sendMail({
            from: propsValue.from,
            to: propsValue.to,
            cc: propsValue.cc,
            inReplyTo: propsValue.replyTo,
            bcc: propsValue.bcc,
            subject: propsValue.subject,
            text: propsValue.body,
        });

        return info;
    },
});