import { createAction, Property, OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { gmailAuth } from '../../';
import { GmailRequests } from '../common/data';
import { GmailLabel } from '../common/models';
import { google } from 'googleapis';
import { OAuth2Client } from 'googleapis-common';

export const gmailRemoveLabelFromThreadAction = createAction({
    auth: gmailAuth,
    name: 'gmail_remove_label_from_thread',
    description: 'Strip a label from all emails in a thread.',
    displayName: 'Remove Label from Thread',
    props: {
        thread_id: Property.ShortText({
            displayName: 'Thread ID',
            description: 'The thread from which to remove the label.',
            required: true,
        }),
        label: Property.Dropdown<GmailLabel>({
            displayName: 'Label',
            description: 'Label to remove from all messages in this thread.',
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
        const { thread_id, label } = propsValue;
        if (!label) {
            throw new Error('Label is required.');
        }
        const authClient = new OAuth2Client();
        authClient.setCredentials(auth);

        const gmail = google.gmail({ version: 'v1', auth: authClient });

        const threadResp = await gmail.users.threads.get({
            userId: 'me',
            id: thread_id,
            format: 'minimal',
        });

        const messageIds = threadResp.data.messages?.map(m => m.id).filter(Boolean) ?? [];
        const results = [];

        for (const msgId of messageIds) {
            const resp = await gmail.users.messages.modify({
                userId: 'me',
                id: msgId!,
                requestBody: {
                    removeLabelIds: [label.id],
                },
            });
            results.push(resp.data);
        }
        return { modifiedMessages: results };
    },
});
