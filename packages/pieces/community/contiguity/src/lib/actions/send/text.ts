import {
    HttpMethod,
    propsValidation,
} from '@activepieces/pieces-common';
import { contiguityAuth } from '../../..';
import {
    Property,
    createAction,
} from '@activepieces/pieces-framework';
import { z } from 'zod';
import { _fetch } from '../../common/request';

export const sendText = createAction({
    auth: contiguityAuth,
    name: 'send_text',
    displayName: 'Send SMS/MMS',
    description: 'Send a text message',
    props: {
        to: Property.ShortText({
            displayName: 'To',
            description: 'Recipient phone number in E.164 format',
            required: true,
        }),
        from: Property.ShortText({
            displayName: 'From',
            description: 'Your leased phone number',
            required: false,
        }),
        message: Property.LongText({
            displayName: 'Message',
            description: 'Text message content',
            required: true,
        }),
        attachments: Property.Array({
            displayName: 'Attachments',
            description: 'File URLs (max 3, 5MB total, HTTPS required)',
            required: false,
            properties: {
                url: Property.ShortText({
                    displayName: 'File URL',
                    description: 'HTTPS URL with file extension',
                    required: true,
                }),
            },
        }),
    },
    async run(context) {
        await propsValidation.validateZod(context.propsValue, {
            to: z.string().regex(/^\+\d{1,4}\d+$/, 'Invalid E.164 format'),
            from: z.string().regex(/^\+\d{1,4}\d+$/, 'Invalid E.164 format').optional(),
            // Messages above >160 characters are supported by Contiguity, they will be automatically split into multiple messages. When MMS launches, messages will not be split unless they exceed 1,600 characters.
            message: z.string().refine((message) => {
                const { attachments } = context.propsValue;
                // Message can be empty if attachments are provided
                return message.trim().length > 0 || (attachments && attachments.length > 0);
            }, 'Message cannot be empty unless attachments are provided'),
            // MMS is supported by Contiguity, however it is in beta as of September 2025. If not a beta tester, attachments[] will be ignored.
            attachments: z.array(
                z.object({
                    url: z.string()
                        .url('Invalid URL format')
                        .regex(/^https:\/\/.*\.[a-zA-Z0-9]+$/, 'Must be a valid, HTTPS-secured URL, with a file extension. Example: https://example.com/image.png')
                })
            ).max(3, 'Maximum 3 attachment URLs').optional(),
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
            auth: context.auth,
        });
    },
});
