import { createAction } from '@activepieces/pieces-framework';
import { gmailAuth, createGoogleClient } from '../auth';
import { gmail as googleGmail } from '@googleapis/gmail';

export const gmailStopWatchAction = createAction({
  auth: gmailAuth,
  name: 'gmail_stop_watch',
  displayName: 'Stop Watch',
  description: 'Stop push notifications on the mailbox.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Stops any active push (Cloud Pub/Sub) notifications for the connected mailbox. Use this to cancel a previously started watch. Takes no parameters. Idempotent: stopping when no watch is active is a no-op.',
    idempotent: true,
  },
  props: {},
  async run(context) {
    const authClient = await createGoogleClient(context.auth);
    const gmail = googleGmail({ version: 'v1', auth: authClient });

    try {
      await gmail.users.stop({ userId: 'me' });
      return { success: true };
    } catch (error: any) {
      if (error.code === 403) {
        throw new Error(
          'Insufficient permissions to stop the watch. Ensure a read scope (e.g. gmail.readonly) is granted.'
        );
      } else if (error.code === 429) {
        throw new Error(
          'Gmail API rate limit exceeded. Please try again later.'
        );
      }
      throw new Error(`Failed to stop watch: ${error.message}`);
    }
  },
});
