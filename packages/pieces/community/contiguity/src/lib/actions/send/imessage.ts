import {
    HttpMethod,
    propsValidation,
} from '@activepieces/pieces-common';
import { contiguityAuth } from '../../..';
import {
    InputPropertyMap,
    MarkdownVariant,
    Property,
    createAction,
} from '@activepieces/pieces-framework';
import * as z from 'zod/mini'
import { _fetch } from '../../common/request';

export const send_iMessage = createAction({
    auth: contiguityAuth,
    name: 'send_imessage',
    classification: 'WRITE',
    displayName: 'Send iMessage',
    description: 'Send an iMessage, with an optional SMS/RCS fallback.',
    audience: 'both',
    aiMetadata: { description: 'Sends an outbound iMessage through Contiguity to a recipient phone number, optionally with attachments (up to 10 HTTPS file URLs) and an SMS/RCS fallback that can trigger when iMessage is unsupported and/or fails. Choose this to message Apple/iMessage recipients; the recipient number must be in E.164 format and the message body is required. Not idempotent: each call dispatches a new message.', idempotent: false },
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
            description: 'Plain text. Formatting is not supported.',
            required: true,
        }),
        fallback: Property.Checkbox({
            displayName: 'Use SMS/RCS Fallback',
            description: 'Send as SMS/RCS instead when iMessage cannot be delivered.',
            required: false,
            defaultValue: false,
        }),
        fallback_when: Property.DynamicProperties({
            auth: contiguityAuth,
            displayName: 'Fallback Options',
            description: 'When to fall back, and which number sends the SMS/RCS.',
            required: true,
            refreshers: ['fallback'],
            props: async (propsValue): Promise<InputPropertyMap> => {
                const fallback = propsValue['fallback'] === true;

                if (!fallback){
                    return{}
                }
                
                if (fallback){
                    return{
                        when: Property.StaticMultiSelectDropdown({
                            displayName: 'Fall Back When',
                            description: 'Pick one or both.',
                            required: true,
                            options: {
                                options:[
                                    { label: 'Recipient has no iMessage', value: 'imessage_unsupported' },
                                    { label: 'iMessage delivery fails', value: 'imessage_fails' },
                                ]
                            }
                        }),
                        from: Property.ShortText({
                            displayName: 'Fallback From',
                            description: 'A number you lease from Contiguity for the SMS/RCS.',
                            placeholder: '+15555550123',
                            required: false,
                        }),
                    };
                }
                return{};
            },
        }),
        attachments: Property.Array({
            displayName: 'Attachments',
            description: 'Up to 10 HTTPS file links, 50 MB in total.',
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
        {
            key: 'fallback',
            display: 'section',
            label: 'Fallback',
            icon: 'reply',
            props: ['fallback', 'fallback_when'],
        },
    ],
    async run(context) {
        await propsValidation.validateZod(context.propsValue, {
            to: z.string().check(z.regex(/^\+\d{1,4}\d+$/, 'Invalid E.164 format')),
            from: z.optional(z.string().check(z.regex(/^\+\d{1,4}\d+$/, 'Must be E.164 format'))),
            message: z.string().check(z.minLength(1, 'Message cannot be empty')),
            fallback: z.optional(z.union([z.boolean(), z.string()])),
            attachments: z.optional(z.array(z.object({
                    url: z.string().check(z.url('Invalid URL format'), z.regex(/^https:\/\/.*\.[a-zA-Z0-9]+$/, 'Must be HTTPS URL with file extension'))
                })).check(z.maxLength(10, 'Maximum 10 attachments'))),
        });

        const { to, from, message, attachments, fallback } = context.propsValue;
        const fallbackOptions = fallback === true ? await resolveFallback(context.propsValue.fallback_when) : undefined;

        const body: SendIMessageBody = {
            to,
            message,
            ...(from ? { from } : {}),
            ...(attachments?.length
                ? { attachments: attachments.map(attachment => (attachment as { url: string }).url) }
                : {}),
            ...(fallbackOptions ? { fallback: fallbackOptions } : {}),
        };

        return await _fetch({
            method: HttpMethod.POST,
            endpoint: '/send/imessage',
            body: body,
            auth: context.auth.secret_text,
        });
    },
});

async function resolveFallback(fallbackWhen: unknown): Promise<FallbackOptions> {
    const raw = typeof fallbackWhen === 'object' && fallbackWhen !== null ? fallbackWhen : {};
    const rawWhen = 'when' in raw && Array.isArray(raw.when) ? raw.when : [];
    const rawFrom = 'from' in raw && typeof raw.from === 'string' && raw.from.length > 0 ? raw.from : undefined;

    await propsValidation.validateZod({ when: rawWhen, from: rawFrom }, {
        when: z.array(z.enum(['imessage_unsupported', 'imessage_fails'])).check(z.minLength(1, 'Select at least one fallback condition')),
        from: z.optional(z.string().check(z.regex(/^\+\d{1,4}\d+$/, 'Must be E.164 format'))),
    });

    const when = rawWhen.filter(isFallbackCondition);

    return { when, ...(rawFrom ? { from: rawFrom } : {}) };
}

function isFallbackCondition(value: unknown): value is FallbackCondition {
    return value === 'imessage_unsupported' || value === 'imessage_fails';
}

type FallbackCondition = 'imessage_unsupported' | 'imessage_fails';

type FallbackOptions = {
    when: FallbackCondition[];
    from?: string;
};

type SendIMessageBody = {
    to: string;
    message: string;
    from?: string;
    attachments?: string[];
    fallback?: FallbackOptions;
};
