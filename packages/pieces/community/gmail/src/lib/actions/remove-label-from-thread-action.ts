import { createAction } from '@activepieces/pieces-framework';
import { gmailAuth, createGoogleClient } from '../auth';
import { gmail as googleGmail } from '@googleapis/gmail';
import { GmailProps } from '../common/props';

export const gmailRemoveLabelFromThreadAction = createAction({
  auth: gmailAuth,
  name: 'remove_label_from_thread',
  displayName: 'Remove Label from Thread',
  description: 'Remove a label from all emails in a thread.',
  audience: 'both',
  aiMetadata: {
    description:
      'Removes a Gmail label from an entire conversation thread by its thread ID, stripping the label from every message in the thread. Idempotent: removing a label the thread does not have is a no-op.',
    idempotent: true,
  },
  props: {
    thread_id: GmailProps.thread,
    label: GmailProps.label({
      displayName: 'Label',
      description: 'The label to remove from the thread.',
      required: true,
    }),
  },
  outputSchema: {
    fields: [
      { key: 'id', label: 'Thread ID' },
      { key: 'historyId', label: 'History ID' },
      { key: 'messages', label: 'Messages' },
    ],
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
