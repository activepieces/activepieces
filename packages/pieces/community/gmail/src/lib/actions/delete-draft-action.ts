import { createAction, Property } from '@activepieces/pieces-framework';
import { gmailAuth, createGoogleClient } from '../auth';
import { gmail as googleGmail } from '@googleapis/gmail';

export const gmailDeleteDraftAction = createAction({
  auth: gmailAuth,
  name: 'gmail_delete_draft',
  displayName: 'Delete Draft',
  description: 'Permanently delete a draft email by its ID.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Permanently removes a draft email by its draft ID. This only deletes the unsent draft (not a sent message) but the draft itself is not recoverable. Obtain the draft ID from List Drafts. Idempotent: if no draft matches the ID (already removed, or an invalid ID) it returns deleted:false instead of failing — check that flag rather than assuming a delete happened.',
    idempotent: true,
  },
  props: {
    draft_id: Property.ShortText({
      displayName: 'Draft ID',
      description: 'The ID of the draft to delete (obtain from List Drafts).',
      required: true,
    }),
  },
  async run(context) {
    const authClient = await createGoogleClient(context.auth);
    const gmail = googleGmail({ version: 'v1', auth: authClient });

    try {
      await gmail.users.drafts.delete({
        userId: 'me',
        id: context.propsValue.draft_id,
      });
      return {
        success: true,
        deleted: true,
        draftId: context.propsValue.draft_id,
      };
    } catch (error: any) {
      if (error.code === 403) {
        throw new Error(
          'Insufficient permissions to delete a draft. Ensure the gmail.compose scope is granted.'
        );
      } else if (error.code === 404) {
        return {
          success: true,
          deleted: false,
          draftId: context.propsValue.draft_id,
          message: `No draft with ID "${context.propsValue.draft_id}" was found — it may already be deleted, or the ID is invalid. Verify with List Drafts.`,
        };
      } else if (error.code === 429) {
        throw new Error(
          'Gmail API rate limit exceeded. Please try again later.'
        );
      }
      throw new Error(`Failed to delete draft: ${error.message}`);
    }
  },
});
