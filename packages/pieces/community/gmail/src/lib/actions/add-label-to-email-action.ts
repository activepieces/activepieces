import { createAction, Property, OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { gmailAuth } from '../../';
import { GmailRequests } from '../common/data';
import { GmailLabel } from '../common/models';
import { google } from 'googleapis';
import { OAuth2Client } from 'googleapis-common';

const ALLOWED_SYSTEM_LABELS = [
    'INBOX', 'STARRED', 'IMPORTANT',
    'CATEGORY_PERSONAL', 'CATEGORY_SOCIAL', 'CATEGORY_PROMOTIONS', 'CATEGORY_UPDATES', 'CATEGORY_FORUMS'
];

export const gmailAddLabelToEmailAction = createAction({
    auth: gmailAuth,
    name: 'gmail_add_label_to_email',
    description: 'Attach a label to an individual email.',
    displayName: 'Add Label to Email',
    props: {
        message_id: Property.ShortText({
            displayName: 'Message ID',
            description: 'The ID of the email to label.',
            required: true,
        }),
        label: Property.Dropdown<GmailLabel>({
            displayName: 'Label',
            description: 'Select a label to attach.',
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
                        .filter(l =>
                            l.type === 'user' ||
                            (l.type === 'system' && ALLOWED_SYSTEM_LABELS.includes(l.id))
                        )
                        .map(label => ({
                            label: label.name,
                            value: label,
                        })),
                };
            },
        }),
        verify_message_exists: Property.Checkbox({
            displayName: 'Verify Message Exists',
            description: 'Check if the message exists before adding labels',
            required: true,
            defaultValue: true,
        }),
    },
    async run({ auth, propsValue }) {
        const { message_id, label, verify_message_exists } = propsValue;
        const labelId = label && label.id;
        console.log('label:', label);
        if (!label || !label.id) {
            throw new Error('A valid label must be selected.');
        }
        const labelIdsToAdd = [label.id];

        const authClient = new OAuth2Client();
        let credentials: any = {};

        if (auth && typeof auth === 'object') {
            if ((auth as any).access_token) {
                credentials.access_token = (auth as any).access_token;
            } else if ((auth as any).data && (auth as any).data.access_token) {
                credentials.access_token = (auth as any).data.access_token;
            }
        }
        authClient.setCredentials(credentials);
        const gmail = google.gmail({ version: 'v1', auth: authClient });

        let originalMessage = null;
        if (verify_message_exists) {
            try {
                const messageResponse = await gmail.users.messages.get({
                    userId: 'me',
                    id: message_id,
                    format: 'minimal',
                });
                originalMessage = messageResponse.data;
            } catch (error) {
                throw new Error(`Message with ID ${message_id} not found or inaccessible`);
            }
        }

        try {
            const modifyResponse = await gmail.users.messages.modify({
                userId: 'me',
                id: message_id,
                requestBody: {
                    addLabelIds: labelIdsToAdd,
                },
            });

            const updatedMessage = await gmail.users.messages.get({
                userId: 'me',
                id: message_id,
                format: 'metadata',
                metadataHeaders: ['Subject', 'From', 'To', 'Date'],
            });

            const headers = updatedMessage.data.payload?.headers || [];
            const headerMap = headers.reduce((acc: { [key: string]: string }, header) => {
                if (header.name && header.value) {
                    acc[header.name.toLowerCase()] = header.value;
                }
                return acc;
            }, {});

            const allLabelsResponse = await GmailRequests.getLabels(auth);
            const labelMap = allLabelsResponse.body.labels.reduce((acc: { [key: string]: string }, label) => {
                acc[label.id] = label.name;
                return acc;
            }, {});

            const addedLabelNames = labelIdsToAdd.map(id => labelMap[id] || id);
            const currentLabelNames = (updatedMessage.data.labelIds || []).map(id => labelMap[id] || id);

            return {
                success: true,
                message: {
                    id: message_id,
                    threadId: updatedMessage.data.threadId,
                    subject: headerMap['subject'] || '',
                    from: headerMap['from'] || '',
                    to: headerMap['to'] || '',
                    date: headerMap['date'] || '',
                    snippet: updatedMessage.data.snippet || '',
                },
                labels: {
                    added: {
                        ids: labelIdsToAdd,
                        names: addedLabelNames,
                        count: labelIdsToAdd.length,
                    },
                    current: {
                        ids: updatedMessage.data.labelIds || [],
                        names: currentLabelNames,
                        count: (updatedMessage.data.labelIds || []).length,
                    },
                },
                operation: {
                    type: 'add_labels',
                    timestamp: new Date().toISOString(),
                    messageVerified: verify_message_exists,
                },
                originalMessage: originalMessage ? {
                    labelIds: originalMessage.labelIds || [],
                    snippet: originalMessage.snippet || '',
                } : null,
            };
        } catch (error: any) {
            if (error.code === 404) {
                throw new Error(`Message with ID ${message_id} not found`);
            } else if (error.code === 400) {
                if (error.message?.includes('Invalid label')) {
                    throw new Error('One or more selected labels are invalid or no longer exist');
                }
                throw new Error(`Invalid request: ${error.message}`);
            } else if (error.code === 403) {
                throw new Error('Insufficient permissions to modify message labels. Ensure the gmail.modify scope is granted.');
            } else if (error.code === 429) {
                throw new Error('API rate limit exceeded. Please try again later.');
            }
            throw new Error(`Failed to add labels to message: ${error.message}`);
        }
    },
});
