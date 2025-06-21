import { createAction, Property } from '@activepieces/pieces-framework';
import { gmailAuth } from '../../';
import { google } from 'googleapis';
import { OAuth2Client } from 'googleapis-common';

export const gmailDeleteEmailAction = createAction({
    auth: gmailAuth,
    name: 'gmail_delete_email',
    description: 'Move an email to Trash (not permanently delete).',
    displayName: 'Delete Email',
    props: {
        message_id: Property.ShortText({
            displayName: 'Message ID',
            description: 'The ID of the email to move to Trash.',
            required: true,
        }),
    },
    async run({ auth, propsValue }) {
        const { message_id } = propsValue;
        const authClient = new OAuth2Client();
        authClient.setCredentials(auth);

        const gmail = google.gmail({ version: 'v1', auth: authClient });

        const result = await gmail.users.messages.trash({
            userId: 'me',
            id: message_id,
        });
        return result.data;
    },
});
