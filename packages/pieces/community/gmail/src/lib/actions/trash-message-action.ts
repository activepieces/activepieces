import { createAction, Property } from '@activepieces/pieces-framework';
import { gmailAuth, createGoogleClient } from '../auth';
import { gmail as googleGmail } from '@googleapis/gmail';

export const gmailTrashMessageAction = createAction({
  auth: gmailAuth,
  name: 'gmail_trash_message',
  displayName: 'Trash Email',
  description:
    'Move a message to the trash (recoverable; auto-purges after ~30 days).',
  audience: 'ai',
  aiMetadata: {
    description:
      'Moves a single message to the trash by id. Safe, recoverable deletion (trash auto-purges after ~30 days) — the correct way for an agent to discard mail; prefer it over permanent deletion. Idempotent: trashing an already-trashed message is a no-op.',
    idempotent: true,
  },
  props: {
    message_id: Property.ShortText({
      displayName: 'Message ID',
      description: 'ID of the message to trash (obtain it from Find Email).',
      required: true,
    }),
  },
  async run(context) {
    const authClient = await createGoogleClient(context.auth);
    const gmail = googleGmail({ version: 'v1', auth: authClient });
    const id = context.propsValue.message_id.trim();

    try {
      const response = await gmail.users.messages.trash({ userId: 'me', id });
      return {
        success: true,
        id: response.data.id,
        label_ids: response.data.labelIds,
      };
    } catch (error: any) {
      if (error.code === 404) {
        throw new Error(`Message not found: ${id}`);
      } else if (error.code === 403) {
        throw new Error(
          'Insufficient permissions. Ensure the gmail.modify scope is granted (reconnect the Gmail account).'
        );
      } else if (error.code === 429) {
        throw new Error(
          'Gmail API rate limit exceeded. Please try again later.'
        );
      }
      throw new Error(`Failed to trash message: ${error.message}`);
    }
  },
});
