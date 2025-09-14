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

export const send_iMessage = createAction({
    auth: contiguityAuth,
    name: 'send_imessage',
    displayName: 'Send iMessage',
    description: 'Send an iMessage',
    props: {
        to: Property.ShortText({
            displayName: 'To',
            description: 'Recipient phone number in E.164 format',
            required: true,
        }),
        from: Property.ShortText({
            displayName: 'From',
            description: 'Your leased iMessage number.',
            required: false,
        }),
        message: Property.LongText({
            displayName: 'Message',
            description: 'iMessage content',
            required: true,
        }),
        fallback: Property.Object({
            displayName: 'SMS/RCS Fallback',
            description: 'Fallback to SMS/RCS when iMessage fails or unsupported',
            required: false,
            properties: {
                when: Property.MultiSelectDropdown({
                    displayName: 'When to Fallback',
                    description: 'Conditions that trigger SMS/RCS fallback',
                    required: true,
                    options: [
                        { label: 'iMessage Unsupported', value: 'imessage_unsupported' },
                        { label: 'iMessage Fails', value: 'imessage_fails' },
                    ],
                }),
                from: Property.ShortText({
                    displayName: 'Fallback From Number',
                    description: 'SMS/RCS number for fallback',
                    required: false,
                }),
            },
        }),
        attachments: Property.Array({
            displayName: 'Attachments',
            description: 'File URLs (max 10, 50MB total, HTTPS required)',
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
            from: z.string().regex(/^\+\d{1,4}\d+$/, 'Must be E.164 format').optional(),
            message: z.string().min(1, 'Message cannot be empty'),
            fallback: z.object({
                when: z.array(z.enum(['imessage_unsupported', 'imessage_fails'])).min(1, 'Select at least one fallback condition'),
                from: z.string().regex(/^\+\d{1,4}\d+$/, 'Must be E.164 format').optional(),
            }).optional(),
            attachments: z.array(
                z.object({
                    url: z.string()
                        .url('Invalid URL format')
                        .regex(/^https:\/\/.*\.[a-zA-Z0-9]+$/, 'Must be HTTPS URL with file extension')
                })
            ).max(10, 'Maximum 10 attachments').optional(),
        });

        const { to, from, message, fallback, attachments } = context.propsValue;

        const body: any = { to, message };

        if (from) body.from = from;
        if (fallback) body.fallback = fallback;
        if (attachments?.length) {
            body.attachments = attachments.map(attachment => attachment.url);
        }

        return await _fetch({
            method: HttpMethod.POST,
            endpoint: '/send/imessage',
            body: body,
            auth: context.auth,
        });
    },
});
