import { createAction } from '@activepieces/pieces-framework';
import { gmailAuth, createGoogleClient } from '../auth';
import { gmail as googleGmail } from '@googleapis/gmail';

export const gmailListLabelsAction = createAction({
  auth: gmailAuth,
  name: 'gmail_list_labels',
  displayName: 'List Labels',
  description: 'List all labels in the mailbox.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists every label in the mailbox (both system labels like INBOX/UNREAD/STARRED and user-created labels) with their IDs, names, and types. This is the primary resolver for label IDs — look up a label ID by name here before passing it to Get Label or any label-aware action. Idempotent: a read-only listing that does not modify the mailbox.',
    idempotent: true,
  },
  props: {},
  async run(context) {
    const authClient = await createGoogleClient(context.auth);
    const gmail = googleGmail({ version: 'v1', auth: authClient });

    try {
      const response = await gmail.users.labels.list({ userId: 'me' });
      const labels = response.data.labels || [];
      return {
        labels,
        count: labels.length,
      };
    } catch (error: any) {
      if (error.code === 403) {
        throw new Error(
          'Insufficient permissions to list labels. Ensure the gmail.readonly scope is granted.'
        );
      } else if (error.code === 429) {
        throw new Error(
          'Gmail API rate limit exceeded. Please try again later.'
        );
      }
      throw new Error(`Failed to list labels: ${error.message}`);
    }
  },
});
