import { createAction, Property } from '@activepieces/pieces-framework';
import { gmailAuth, createGoogleClient } from '../auth';
import { gmail as googleGmail } from '@googleapis/gmail';
import { gmailModifyLabelsActionOutputSchema } from '../output-schemas';
import { gmailValidation } from '../common/validation';

const GMAIL_BATCH_MODIFY_LIMIT = 1000;

export const gmailModifyLabelsAction = createAction({
  auth: gmailAuth,
  name: 'gmail_modify_labels',
  classification: 'WRITE',
  displayName: 'Modify Labels',
  description:
    'Add and/or remove labels across one or more email messages in a single call.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Adds and/or removes label IDs across up to 1000 message IDs at once — the batch way to label, unlabel, mark read/unread (the UNREAD label), or archive (the INBOX label) many messages together. Resolve label IDs with List Labels or Get or Create Label, and message IDs with Search Email. At least one of Add Label IDs or Remove Label IDs must be set. Idempotent: true — re-applying the same add/remove sets converges on the same label state and has no additional effect.',
    idempotent: true,
  },
  props: {
    message_ids: Property.Array({
      displayName: 'Message IDs',
      description:
        'The Gmail message IDs to modify (obtain from Search Email or Get Message). Up to 1000 per call.',
      required: true,
    }),
    add_label_ids: Property.Array({
      displayName: 'Label IDs to Add',
      description:
        'Label IDs to add to every message listed above (obtain from List Labels or Get or Create Label).',
      required: false,
    }),
    remove_label_ids: Property.Array({
      displayName: 'Label IDs to Remove',
      description:
        'Label IDs to remove from every message listed above (obtain from List Labels).',
      required: false,
    }),
  },
  outputSchema: gmailModifyLabelsActionOutputSchema,
  async run(context) {
    const authClient = await createGoogleClient(context.auth);
    const gmail = googleGmail({ version: 'v1', auth: authClient });
    const messageIds = gmailValidation.toStringArray(
      context.propsValue.message_ids,
      'Message IDs'
    );
    const addLabelIds = gmailValidation.toStringArray(
      context.propsValue.add_label_ids ?? [],
      'Label IDs to Add'
    );
    const removeLabelIds = gmailValidation.toStringArray(
      context.propsValue.remove_label_ids ?? [],
      'Label IDs to Remove'
    );

    if (messageIds.length === 0) {
      throw new Error('At least one message ID is required.');
    }
    if (messageIds.length > GMAIL_BATCH_MODIFY_LIMIT) {
      throw new Error(
        `Gmail's batch modify accepts at most ${GMAIL_BATCH_MODIFY_LIMIT} message IDs per call; received ${messageIds.length}.`
      );
    }
    if (addLabelIds.length === 0 && removeLabelIds.length === 0) {
      throw new Error(
        'At least one of Label IDs to Add or Label IDs to Remove is required.'
      );
    }

    try {
      await gmail.users.messages.batchModify({
        userId: 'me',
        requestBody: {
          ids: messageIds,
          addLabelIds: addLabelIds.length > 0 ? addLabelIds : undefined,
          removeLabelIds:
            removeLabelIds.length > 0 ? removeLabelIds : undefined,
        },
      });
      return {
        success: true,
        messageCount: messageIds.length,
        messageIds,
        addedLabelIds: addLabelIds,
        removedLabelIds: removeLabelIds,
      };
    } catch (error: any) {
      if (error.code === 403) {
        throw new Error(
          'Insufficient permissions to modify labels on these messages. Ensure the gmail.modify scope is granted.'
        );
      } else if (error.code === 404) {
        throw new Error(
          'One or more message IDs were not found. Use Search Email or Get Message to find valid message IDs.'
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
