import { createAction } from '@activepieces/pieces-framework';
import { gmailAuth, createGoogleClient } from '../auth';
import { gmail as googleGmail } from '@googleapis/gmail';
import { GmailProps } from '../common/props';

export const gmailAddLabelToEmailAction = createAction({
  auth: gmailAuth,
  name: 'add_label_to_email',
  displayName: 'Add Label to Email',
  description: 'Add a label to a specific email.',
  audience: 'both',
  aiMetadata: {
    description:
      'Applies a Gmail label to a single message identified by its message ID. Use this to categorize or tag an email (for example mark it Important or file it under a user label). Idempotent: applying a label the message already has is a no-op.',
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
  outputSchema: {
    fields: [
      { key: 'id', label: 'Message ID' },
      { key: 'threadId', label: 'Thread ID' },
      { key: 'labelIds', label: 'Labels' },
    ],
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
