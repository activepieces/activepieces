import { createAction, Property } from '@activepieces/pieces-framework';
import { gmailAuth, createGoogleClient } from '../auth';
import { gmail as googleGmail } from '@googleapis/gmail';

export const gmailModifyLabelsAction = createAction({
  auth: gmailAuth,
  name: 'gmail_modify_labels',
  displayName: 'Modify Email Labels',
  description:
    'Add and/or remove labels on one or more messages in a single batch call.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Adds and/or removes label ids on up to 1000 messages in one call — the mailbox-state primitive. Express common intents as label changes: archive (remove INBOX), mark read/unread (remove/add UNREAD), star (add STARRED), or apply/remove a custom label. Resolve label names to ids with List Labels first. To delete a message use Trash Email instead — do not apply the TRASH label here. Idempotent: re-applying the same label changes is a no-op.',
    idempotent: true,
  },
  props: {
    message_ids: Property.Array({
      displayName: 'Message IDs',
      description:
        'IDs of the messages to modify (obtain them from Find Email).',
      required: true,
    }),
    add_label_ids: Property.Array({
      displayName: 'Add Label IDs',
      description:
        'Label ids to add (resolve names via List Labels). System ids include UNREAD, STARRED, IMPORTANT, SPAM.',
      required: false,
    }),
    remove_label_ids: Property.Array({
      displayName: 'Remove Label IDs',
      description:
        'Label ids to remove. Remove INBOX to archive; remove UNREAD to mark as read.',
      required: false,
    }),
  },
  async run(context) {
    const authClient = await createGoogleClient(context.auth);
    const gmail = googleGmail({ version: 'v1', auth: authClient });

    const ids = (context.propsValue.message_ids as string[]) ?? [];
    const addLabelIds = (context.propsValue.add_label_ids as string[]) ?? [];
    const removeLabelIds =
      (context.propsValue.remove_label_ids as string[]) ?? [];

    if (ids.length === 0) {
      throw new Error('At least one message ID is required.');
    }
    if (addLabelIds.length === 0 && removeLabelIds.length === 0) {
      throw new Error('Provide at least one label id to add or remove.');
    }

    try {
      await gmail.users.messages.batchModify({
        userId: 'me',
        requestBody: { ids, addLabelIds, removeLabelIds },
      });
      return {
        success: true,
        modified_count: ids.length,
        message_ids: ids,
        added: addLabelIds,
        removed: removeLabelIds,
      };
    } catch (error: any) {
      if (error.code === 400) {
        throw new Error(
          `Invalid modify request — verify every label id exists (use List Labels): ${error.message}`
        );
      } else if (error.code === 403) {
        throw new Error(
          'Insufficient permissions. Ensure the gmail.modify scope is granted (reconnect the Gmail account).'
        );
      } else if (error.code === 429) {
        throw new Error(
          'Gmail API rate limit exceeded. Please try again later.'
        );
      }
      throw new Error(`Failed to modify labels: ${error.message}`);
    }
  },
});
