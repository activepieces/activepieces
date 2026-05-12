import { createAction, Property } from '@activepieces/pieces-framework';
import { gmailAuth, createGoogleClient } from '../auth';
import { google } from 'googleapis';
import { GmailProps } from '../common/props';

export const gmailAddLabelAction = createAction({
  auth: gmailAuth,
  name: 'add_label_to_email',
  displayName: 'Add Label to Email',
  description: 'Attach a label to an individual email.',
  props: {
    message_id: GmailProps.message,
    label_ids: Property.Array({
      displayName: 'Labels',
      description: 'One or more label IDs to add to the email.',
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
        addLabelIds: context.propsValue.label_ids as string[],
      },
    });

    return response.data;
  },
});
