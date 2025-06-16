import { createAction, Property, OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { gmailAuth } from '../../';
import { GmailRequests } from '../common/data';
import { GmailLabel } from '../common/models';
import { google } from 'googleapis';
import { OAuth2Client } from 'googleapis-common';

export const gmailRemoveLabelFromEmailAction = createAction({
    auth: gmailAuth,
    name: 'gmail_remove_label_from_email',
    description: 'Remove a specific label from an email.',
    displayName: 'Remove Label from Email',
    props: {
        message_id: Property.ShortText({
            displayName: 'Message ID',
            description: 'The ID of the email to update.',
            required: true,
        }),
        label: Property.Dropdown<GmailLabel>({
            displayName: 'Label',
            description: 'Select the label to remove.',
            required: true,
            refreshers: [],
            options: async ({ auth }) => {
                if (!auth) {
                    return {
                        disabled: true,
                        options: [],
                        placeholder: 'Please authenticate first',
                    };
                }
                const response = await GmailRequests.getLabels(auth as OAuth2PropertyValue);
                return {
                    disabled: false,
                    options: response.body.labels
                        .filter(l => l.type === 'user' || l.type === 'system')
                        .map(label => ({
                            label: label.name,
                            value: label,
                        })),
                };
            },
        }),
    },
    async run({ auth, propsValue }) {
        const { message_id, label } = propsValue;
        if (!label) {
            throw new Error('Label is required.');
        }
        const authClient = new OAuth2Client();
        authClient.setCredentials(auth);

        const gmail = google.gmail({ version: 'v1', auth: authClient });

        const result = await gmail.users.messages.modify({
            userId: 'me',
            id: message_id,
            requestBody: {
                removeLabelIds: [label.id],
            },
        });
        return result.data;
    },
});
