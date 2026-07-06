import { createAction, Property } from '@activepieces/pieces-framework';
import { connectucAuth } from '../../index';
import { connectucApiCall } from '../common/api-helpers';
import { smsNumberProp } from '../common/props';
import { HttpMethod } from '@activepieces/pieces-common';
import { randomUUID } from 'crypto';

export const sendSmsAction = createAction({
    auth: connectucAuth,
    name: 'send-sms',
    displayName: 'Send SMS',
    description: 'Send an SMS message through ConnectUC',
    audience: 'both',
    aiMetadata: { description: 'Sends an SMS/MMS text message from a ConnectUC sender number to one or more recipient phone numbers, optionally with media attachment URLs. Use when an agent needs to text a person or group. Not idempotent: each call sends a new message (a fresh reference ID is generated per call), so repeating it delivers duplicate texts.', idempotent: false },
    props: {
        recipients: Property.Array({
            displayName: 'SMS Destinations',
            description: 'The phone number to send the SMS to',
            required: true,
        }),
        content: Property.LongText({
            displayName: 'Message',
            description: 'The SMS message content',
            required: true,
        }),
        sender: smsNumberProp(),
        attachment_urls: Property.Array({
            displayName: 'Media Attachments',
            description: 'The media attachment urls for the SMS message',
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
                filename: urlStr.split('/').pop() ?? 'attachment',
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
