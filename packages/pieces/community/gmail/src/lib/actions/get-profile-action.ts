import { createAction } from '@activepieces/pieces-framework';
import { gmailAuth, createGoogleClient } from '../auth';
import { gmail as googleGmail } from '@googleapis/gmail';
import { gmailGetProfileActionOutputSchema } from '../output-schemas';

export const gmailGetProfileAction = createAction({
  auth: gmailAuth,
  name: 'gmail_get_profile',
  displayName: 'Get Profile',
  description: 'Get the connected mailbox profile.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Returns the connected mailbox profile: the account email address, total message and thread counts, and the current history ID. Use this to confirm which account is connected or to obtain the starting history ID for List History. Idempotent: a read-only lookup that does not modify the mailbox.',
    idempotent: true,
  },
  props: {},
  outputSchema: gmailGetProfileActionOutputSchema,
  async run(context) {
    const authClient = await createGoogleClient(context.auth);
    const gmail = googleGmail({ version: 'v1', auth: authClient });

    try {
      const response = await gmail.users.getProfile({ userId: 'me' });
      return response.data;
    } catch (error: any) {
      if (error.code === 403) {
        throw new Error(
          'Insufficient permissions to read the profile. Ensure a read scope (e.g. gmail.readonly) is granted.'
        );
      } else if (error.code === 429) {
        throw new Error(
          'Gmail API rate limit exceeded. Please try again later.'
        );
      }
      throw new Error(`Failed to get profile: ${error.message}`);
    }
  },
});
