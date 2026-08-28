import { createAction, Property } from '@activepieces/pieces-framework';
import { gmailAuth, createGoogleClient } from '../auth';
import { gmail as googleGmail } from '@googleapis/gmail';
import { GmailProps } from '../common/props';
import { gmailRemoveLabelFromThreadActionOutputSchema } from '../output-schemas';

export const gmailRemoveLabelFromThreadAction = createAction({
  auth: gmailAuth,
  name: 'remove_label_from_thread',
  classification: 'WRITE',
  displayName: 'Remove Label from Thread',
  description: 'Strip a label from all emails in a thread.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Removes a label from every message in a Gmail thread, identified by its thread ID. Use this to de-categorize or un-flag an entire conversation at once (for example, removing STARRED from all messages in the thread). Requires the gmail.modify scope. Iterates over each message in the thread and applies a label removal; removing an absent label from a message is a safe no-op.',
    idempotent: false,
  },
  props: {
    thread_id: GmailProps.thread,
    label: GmailProps.label({ required: true }),
  },
  outputSchema: gmailRemoveLabelFromThreadActionOutputSchema,
  async run(context) {
    const authClient = await createGoogleClient(context.auth);
    const gmail = googleGmail({ version: 'v1', auth: authClient });

    const label = context.propsValue.label;
    const labelId = (label as { id?: string }).id;

    if (!labelId) {
      throw new Error(
        'The selected label does not have a valid ID. Please choose a label or provide one manually.'
      );
    }

    try {
      const threadResponse = await gmail.users.threads.get({
        userId: 'me',
        id: context.propsValue.thread_id,
        format: 'minimal',
      });

      const messages = threadResponse.data.messages || [];
      const results = [];

      for (const message of messages) {
        if (!message.id) {
          continue;
        }
        const response = await gmail.users.messages.modify({
          userId: 'me',
          id: message.id,
          requestBody: {
            removeLabelIds: [labelId],
          },
        });
        results.push(response.data);
      }

      return {
        id: context.propsValue.thread_id,
        messages: results,
      };
    } catch (error: any) {
      if (error.code === 403) {
        throw new Error(
          'Insufficient permissions to modify the thread. Ensure the gmail.modify scope is granted.'
        );
      } else if (error.code === 404) {
        throw new Error(
          `Thread not found: "${context.propsValue.thread_id}". Use the Thread dropdown to pick a valid thread ID.`
        );
      } else if (error.code === 429) {
        throw new Error(
          'Gmail API rate limit exceeded. Please try again later.'
        );
      }
      throw new Error(`Failed to remove label from thread: ${error.message}`);
    }
  },
});
