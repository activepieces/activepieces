import { createAction, Property } from '@activepieces/pieces-framework';
import { gmailAuth, createGoogleClient } from '../auth';
import { gmail as googleGmail } from '@googleapis/gmail';
import { gmailModifyThreadLabelsActionOutputSchema } from '../output-schemas';
import { gmailValidation } from '../common/validation';

export const gmailModifyThreadLabelsAction = createAction({
  auth: gmailAuth,
  name: 'gmail_modify_thread_labels',
  classification: 'WRITE',
  displayName: 'Modify Thread Labels',
  description:
    'Add and/or remove labels across every message in a thread in a single call.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Adds and/or removes label IDs across every message in a single thread — the way to label, unlabel, mark read/unread (the UNREAD label), or archive (the INBOX label) an entire conversation at once by thread ID rather than one message at a time. Use Modify Labels instead when you only have individual message IDs, not a thread ID. Resolve label IDs with List Labels or Get or Create Label, and the thread ID with Search Email or Get Thread. At least one of Add Label IDs or Remove Label IDs must be set. Idempotent: true — re-applying the same add/remove sets converges on the same label state and has no additional effect.',
    idempotent: true,
  },
  props: {
    thread_id: Property.ShortText({
      displayName: 'Thread ID',
      description:
        'The Gmail thread ID to modify (obtain from Search Email or Get Thread).',
      required: true,
    }),
    add_label_ids: Property.Array({
      displayName: 'Label IDs to Add',
      description:
        'Label IDs to add to every message in the thread (obtain from List Labels or Get or Create Label).',
      required: false,
    }),
    remove_label_ids: Property.Array({
      displayName: 'Label IDs to Remove',
      description:
        'Label IDs to remove from every message in the thread (obtain from List Labels).',
      required: false,
    }),
  },
  outputSchema: gmailModifyThreadLabelsActionOutputSchema,
  async run(context) {
    const authClient = await createGoogleClient(context.auth);
    const gmail = googleGmail({ version: 'v1', auth: authClient });
    const threadId = context.propsValue.thread_id;
    const addLabelIds = gmailValidation.toStringArray(
      context.propsValue.add_label_ids ?? [],
      'Label IDs to Add'
    );
    const removeLabelIds = gmailValidation.toStringArray(
      context.propsValue.remove_label_ids ?? [],
      'Label IDs to Remove'
    );

    if (addLabelIds.length === 0 && removeLabelIds.length === 0) {
      throw new Error(
        'At least one of Label IDs to Add or Label IDs to Remove is required.'
      );
    }

    try {
      const response = await gmail.users.threads.modify({
        userId: 'me',
        id: threadId,
        requestBody: {
          addLabelIds: addLabelIds.length > 0 ? addLabelIds : undefined,
          removeLabelIds:
            removeLabelIds.length > 0 ? removeLabelIds : undefined,
        },
      });
      return response.data;
    } catch (error: any) {
      if (error.code === 403) {
        throw new Error(
          'Insufficient permissions to modify labels on this thread. Ensure the gmail.modify scope is granted.'
        );
      } else if (error.code === 404) {
        throw new Error(
          `Thread not found: "${threadId}". Use Search Email or Get Thread to find a valid thread ID.`
        );
      } else if (error.code === 429) {
        throw new Error(
          'Gmail API rate limit exceeded. Please try again later.'
        );
      }
      throw new Error(`Failed to modify thread labels: ${error.message}`);
    }
  },
});
