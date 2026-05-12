import { createAction, Property } from '@activepieces/pieces-framework';
import { gmailAuth, createGoogleClient } from '../auth';
import { google } from 'googleapis';
import { GmailProps } from '../common/props';

export const gmailRemoveLabelAction = createAction({
  auth: gmailAuth,
  name: 'remove_label_from_email',
  displayName: 'Remove Label from Email',
  description: 'Remove a specific label from an email.',
  props: {
    message_id: GmailProps.message,
    label_ids: Property.Array({
      displayName: 'Labels',
      description: 'One or more label IDs to remove from the email.',
      required: true,
    }),
  },
  async run(context) {
    const authClient = await createGoogleClient(context.auth);
    const gmail = google.gmail({ version: 'v1', auth: authClient });

    const response = await gmail.users.messages.modify({
      userId: 'me',
      id: context.propsValue.message_id,
      requestBody: {
        removeLabelIds: context.propsValue.label_ids as string[],
      },
    });

    return response.data;
  },
});
