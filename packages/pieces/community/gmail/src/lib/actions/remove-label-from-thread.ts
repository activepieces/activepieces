import { createAction } from '@activepieces/pieces-framework';
import { gmailAuth, createGoogleClient } from '../auth';
import { gmail as googleGmail } from '@googleapis/gmail';
import { GmailProps } from '../common/props';

export const gmailRemoveLabelFromThreadAction = createAction({
  auth: gmailAuth,
  name: 'remove_label_from_thread',
  displayName: 'Remove Label from Thread',
  description: 'Remove a specific label from a thread.',
  audience: 'both',
  aiMetadata: {
    description: 'Removes a specified label from all messages in a thread by thread ID.',
    idempotent: true,
  },
  props: {
    thread_id: GmailProps.thread,
    label: GmailProps.label({
      displayName: 'Label',
      description: 'The label to remove from the thread',
      required: true,
    }),
  },
  async run(context) {
    const authClient = await createGoogleClient(context.auth);
    const gmail = googleGmail({ version: 'v1', auth: authClient });

    const response = await gmail.users.threads.modify({
      userId: 'me',
      id: context.propsValue.thread_id,
      requestBody: {
        removeLabelIds: [context.propsValue.label.id],
      },
    });

    return response.data;
  },
});
