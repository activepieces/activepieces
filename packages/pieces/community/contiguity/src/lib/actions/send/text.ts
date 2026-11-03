import {
    HttpMethod,
    propsValidation,
} from '@activepieces/pieces-common';
import { contiguityAuth } from '../../..';
import {
    MarkdownVariant,
    Property,
    createAction,
} from '@activepieces/pieces-framework';
import * as z from 'zod/mini'
import { _fetch } from '../../common/request';

export const sendText = createAction({
    auth: contiguityAuth,
    name: 'send_text',
    classification: 'WRITE',
    displayName: 'Send SMS/MMS',
    description: 'Send an SMS, or an MMS when you attach files.',
    audience: 'both',
    aiMetadata: { description: 'Sends an outbound SMS (or MMS when attachments are supplied) through Contiguity to a recipient phone number. Choose this to deliver a text notification or message; the recipient number must be in E.164 format, and the body can be empty only when attachments (up to 3 HTTPS file URLs) are provided. Not idempotent: each call dispatches a new message.', idempotent: false },
    props: {
        numbers_note: Property.MarkDown({
            value: 'Use international format: a + followed by the country code and number.',
            variant: MarkdownVariant.INFO,
        }),
        to: Property.ShortText({
            displayName: 'To',
            description: 'The mobile number that receives the message.',
            placeholder: '+15555550123',
            width: 'half',
            required: true,
        }),
        from: Property.ShortText({
            displayName: 'From',
            description: 'A number you lease from Contiguity.',
            placeholder: '+15555550123',
            width: 'half',
            required: false,
        }),
        message: Property.LongText({
            displayName: 'Message',
            description: 'Plain text. Texts over 160 characters are split automatically.',
            required: true,
        }),
        attachments: Property.Array({
            displayName: 'Attachments',
            description: 'Up to 3 HTTPS file links, 5 MB in total.',
            required: false,
            properties: {
                url: Property.ShortText({
                    displayName: 'File URL',
                    description: 'Must start with https:// and end in a file extension.',
                    placeholder: 'https://example.com/photo.png',
                    required: true,
                }),
            },
        }),
    },
    propertyGroups: [
        {
            key: 'numbers',
            display: 'section',
            label: 'Phone Numbers',
            icon: 'send',
            props: ['numbers_note', 'to', 'from'],
        },
        {
            key: 'content',
            display: 'section',
            label: 'Content',
            icon: 'text',
            props: ['message', 'attachments'],
        },
    ],
    async run(context) {
        await propsValidation.validateZod(context.propsValue, {
            to: z.string().check(z.regex(/^\+\d{1,4}\d+$/, 'Invalid E.164 format')),
            from: z.optional(z.string().check(z.regex(/^\+\d{1,4}\d+$/, 'Invalid E.164 format'))),
            // Messages above >160 characters are supported by Contiguity, they will be automatically split into multiple messages. When MMS launches, messages will not be split unless they exceed 1,600 characters.
            message: z.string().check(z.refine((message) => {
                const { attachments } = context.propsValue;
                // Message can be empty if attachments are provided
                return message.trim().length > 0 || (attachments && attachments.length > 0);
            }, 'Message cannot be empty unless attachments are provided')),
            // MMS is supported by Contiguity, however it is in beta as of September 2025. If not a beta tester, attachments[] will be ignored.
            attachments: z.optional(z.array(z.object({
                    url: z.string().check(z.url('Invalid URL format'), z.regex(/^https:\/\/.*\.[a-zA-Z0-9]+$/, 'Must be a valid, HTTPS-secured URL, with a file extension. Example: https://example.com/image.png'))
                })).check(z.maxLength(3, 'Maximum 3 attachment URLs'))),
        });

        const { to, from, message, attachments } = context.propsValue;

        const body: any = { to, message };
        if (from) body.from = from;
        if (attachments?.length) {
            body.attachments = attachments.map(attachment => (attachment as {url: string}).url);
        }

        return await _fetch({
            method: HttpMethod.POST,
            endpoint: '/send/text',
            body: body,
            auth: context.auth.secret_text,
        });
    },
});
