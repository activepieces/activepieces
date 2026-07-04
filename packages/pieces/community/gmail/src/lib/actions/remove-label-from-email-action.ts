import { createAction } from '@activepieces/pieces-framework';
import { gmailAuth, createGoogleClient } from '../auth';
import { gmail as googleGmail } from '@googleapis/gmail';
import { GmailProps } from '../common/props';

export const gmailRemoveLabelFromEmailAction = createAction({
  auth: gmailAuth,
  name: 'remove_label_from_email',
  displayName: 'Remove Label from Email',
  description: 'Remove a label from a specific email.',
  audience: 'both',
  aiMetadata: {
    description:
      'Removes a Gmail label from a single message identified by its message ID. Idempotent: removing a label the message does not have is a no-op.',
    idempotent: true,
  },
  props: {
    message_id: GmailProps.message,
    label: GmailProps.label({
      displayName: 'Label',
      description: 'The label to remove from the email.',
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
        removeLabelIds: [context.propsValue.label.id],
      },
    });

    return response.data;
  },
});
