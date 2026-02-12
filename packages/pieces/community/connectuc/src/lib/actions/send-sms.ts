import { createAction, Property } from '@activepieces/pieces-framework';
import { connectucAuth } from '../../index';
import { connectucApiCall } from '../common/api-helpers';
import { HttpMethod } from '@activepieces/pieces-common';
import { randomUUID } from 'crypto';

export const sendSmsAction = createAction({
    auth: connectucAuth,
    name: 'send-sms',
    displayName: 'Send SMS',
    description: 'Send an SMS message through ConnectUC',
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
        sender: Property.ShortText({
            displayName: 'SMS Sender',
            description: 'The SMS message sender',
            required: true,
        }),
        attachment_urls: Property.Array({
            displayName: 'Media Attachments',
            description: 'The media attachment urls for the SMS message',
            required: false,
        }),
    },
    async run(context) {
        const { recipients, content, sender, attachment_urls } = context.propsValue;

        const media = attachment_urls && (attachment_urls as unknown[]).length > 0 ? (attachment_urls as string[]).map((url: string) => {
            const filename = url.split('/').pop();
            return ({
                url: url,
                filename: filename ? filename : 'attachment'
            });
        }) : [];

        // Build request body
        const body: Record<string, unknown> = {
            application: 'connectuc',
            content: content,
            media: media,
            recipients: recipients,
            referenceId: randomUUID(),
            sender: sender,
        };

        try {
            // Make API call to send SMS
            const response = await connectucApiCall({
                accessToken: context.auth.access_token,
                endpoint: '/sms/messages',
                method: HttpMethod.POST,
                body,
            });

            return response;
        } catch (error: unknown) {
            // Provide helpful error message
            const err = error as { response?: { body?: { message?: string } }; message?: string };
            const errorMessage = err.response?.body?.message || err.message || 'Unknown error occurred';
            throw new Error(`Failed to send SMS: ${errorMessage}`);
        }
    },
});
