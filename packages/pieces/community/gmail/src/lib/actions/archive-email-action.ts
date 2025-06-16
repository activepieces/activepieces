import { createAction, Property } from '@activepieces/pieces-framework';
import { gmailAuth } from '../../';
import { google } from 'googleapis';
import { OAuth2Client } from 'googleapis-common';

export const gmailArchiveEmailAction = createAction({
    auth: gmailAuth,
    name: 'gmail_archive_email',
    description: 'Archive an email (move to "All Mail" instead of deleting).',
    displayName: 'Archive Email',
    props: {
        message_id: Property.ShortText({
            displayName: 'Message ID',
            description: 'The ID of the email to archive.',
            required: true,
        }),
    },
    async run({ auth, propsValue }) {
        const { message_id } = propsValue;
        const authClient = new OAuth2Client();
        authClient.setCredentials(auth);

        const gmail = google.gmail({ version: 'v1', auth: authClient });

        const result = await gmail.users.messages.modify({
            userId: 'me',
            id: message_id,
            requestBody: {
                removeLabelIds: ['INBOX'],
            },
        });
        return result.data;
    },
});
