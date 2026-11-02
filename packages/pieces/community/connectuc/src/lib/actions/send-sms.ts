import { createAction, Property } from '@activepieces/pieces-framework';
import { connectucAuth } from '../../index';
import { connectucApiCall } from '../common/api-helpers';
import { smsNumberProp } from '../common/props';
import { HttpMethod } from '@activepieces/pieces-common';
import { randomUUID } from 'crypto';

export const sendSmsAction = createAction({
    auth: connectucAuth,
    name: 'send-sms',
    classification: 'WRITE',
    displayName: 'Send SMS',
    description: 'Send a text from one of your ConnectUC numbers.',
    audience: 'both',
    aiMetadata: { description: 'Sends an SMS/MMS text message from a ConnectUC sender number to one or more recipient phone numbers, optionally with media attachment URLs. Use when an agent needs to text a person or group. Not idempotent: each call sends a new message (a fresh reference ID is generated per call), so repeating it delivers duplicate texts.', idempotent: false },
    props: {
        sender: smsNumberProp(),
        recipients: Property.Array({
            displayName: 'To',
            description: 'Phone numbers to text, one per entry.',
            required: true,
        }),
        content: Property.LongText({
            displayName: 'Message',
            required: true,
        }),
        attachment_urls: Property.Array({
            displayName: 'Media URLs',
            description: 'Public links to images or files to send with the text.',
            required: false,
        }),
    },
    async run(context) {
        const { recipients, content, sender, attachment_urls } = context.propsValue;

        const recipientList = (recipients ?? [])
            .map((recipient) => String(recipient).trim())
            .filter((recipient) => recipient.length > 0);

        if (recipientList.length === 0) {
            throw new Error('At least one SMS destination is required');
        }

        const media = attachment_urls && attachment_urls.length > 0 ? attachment_urls.map((url) => {
            const urlStr = String(url);
            return {
                url: urlStr,
                filename: urlStr.split('?')[0].split('/').pop() || 'attachment',
            };
        }) : [];

        const body: Record<string, unknown> = {
            application: 'connectuc',
            content: content,
            media: media,
            recipients: recipientList,
            referenceId: randomUUID(),
            sender: sender,
        };

        try {
            const response = await connectucApiCall({
                accessToken: context.auth.access_token,
                endpoint: '/sms/messages',
                method: HttpMethod.POST,
                body,
            });

            return response;
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Unknown error occurred';
            throw new Error(`Failed to send SMS: ${message}`);
        }
    },
});
