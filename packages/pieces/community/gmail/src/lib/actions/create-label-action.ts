import { createAction, Property } from '@activepieces/pieces-framework';
import { gmailAuth } from '../../';
import { google } from 'googleapis';
import { OAuth2Client } from 'googleapis-common';

export const gmailCreateLabelAction = createAction({
    auth: gmailAuth,
    name: 'gmail_create_label',
    description: 'Create a new user label in Gmail.',
    displayName: 'Create Label',
    props: {
        label_name: Property.ShortText({
            displayName: 'Label Name',
            description: 'The name for the new label (max 50 chars, no < > ").',
            required: true,
        }),
        label_list_visibility: Property.StaticDropdown({
            displayName: 'Label List Visibility',
            description: 'Where the label appears in Gmail’s sidebar label list.',
            required: false,
            defaultValue: 'labelShow',
            options: {
                disabled: false,
                options: [
                    { label: 'Show', value: 'labelShow' },
                    { label: 'Show If Unread', value: 'labelShowIfUnread' },
                    { label: 'Hide', value: 'labelHide' },
                ],
            },
        }),
        message_list_visibility: Property.StaticDropdown({
            displayName: 'Message List Visibility',
            description: 'If conversations with this label appear in message lists.',
            required: false,
            defaultValue: 'show',
            options: {
                disabled: false,
                options: [
                    { label: 'Show', value: 'show' },
                    { label: 'Hide', value: 'hide' },
                ],
            },
        }),
        color_background: Property.ShortText({
            displayName: 'Label Background Color (hex)',
            description: 'Optional background color, e.g. #43d692',
            required: false,
        }),
        color_text: Property.ShortText({
            displayName: 'Label Text Color (hex)',
            description: 'Optional text color, e.g. #000000',
            required: false,
        }),
    },
    async run({ auth, propsValue }) {
        const {
            label_name,
            label_list_visibility,
            message_list_visibility,
            color_background,
            color_text,
        } = propsValue;

        if (!label_name || label_name.length > 50 || /[<>"]/.test(label_name)) {
            throw new Error('Label name is required, max 50 chars, and cannot contain < > "');
        }

        const authClient = new OAuth2Client();
        authClient.setCredentials(auth);
        const gmail = google.gmail({ version: 'v1', auth: authClient });

        const labelResource: any = {
            name: label_name,
            labelListVisibility: label_list_visibility || 'labelShow',
            messageListVisibility: message_list_visibility || 'show',
        };

        if (color_background || color_text) {
            labelResource.color = {};
            if (color_background) labelResource.color.backgroundColor = color_background;
            if (color_text) labelResource.color.textColor = color_text;
        }

        try {
            const result = await gmail.users.labels.create({
                userId: 'me',
                requestBody: labelResource,
            });
            return {
                success: true,
                label: result.data,
            };
        } catch (error: any) {
            const errorMsg = error?.errors?.[0]?.message || error?.message || '';
            if (errorMsg.includes('already exists')) {
                throw new Error(`Label "${label_name}" already exists.`);
            }
            if (errorMsg.includes('Invalid label name')) {
                throw new Error('Invalid label name. No < > " and max 50 characters.');
            }
            if (errorMsg.includes('Invalid value at')) {
                throw new Error('Invalid label visibility value—check your field values.');
            }
            throw new Error('Gmail API Error: ' + errorMsg);
        }
    },
});
