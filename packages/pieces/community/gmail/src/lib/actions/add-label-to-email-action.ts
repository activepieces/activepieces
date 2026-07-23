import { createAction } from '@activepieces/pieces-framework';
import { gmailAuth, createGoogleClient } from '../auth';
import { gmail as googleGmail } from '@googleapis/gmail';
import { GmailProps } from '../common/props';

export const gmailAddLabelToEmailAction = createAction({
  auth: gmailAuth,
  name: 'add_label_to_email',
  displayName: 'Add Label to Email',
  description: 'Attach a label to an individual email.',
  audience: 'both',
  aiMetadata: {
    description:
      'Adds a label to a single email identified by its Gmail message ID. Use this to categorize or flag a known message. Idempotent: adding a label that is already applied leaves the message unchanged.',
    idempotent: true,
  },
  props: {
    message_id: GmailProps.message,
    label: GmailProps.label({
      displayName: 'Label',
      description: 'The label to add to the email.',
      required: true,
    }),
  },
  async run(context) {
    const authClient = await createGoogleClient(context.auth);
    const gmail = googleGmail({ version: 'v1', auth: authClient });

    const response = await gmail.users.messages.modify({
      userId: 'me',
      id: context.propsValue.message_id,
      requestBody: {
        addLabelIds: [context.propsValue.label.id],
      },
    });

    return response.data;
  },
});
