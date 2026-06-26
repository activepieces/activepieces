import { createAction, Property } from '@activepieces/pieces-framework';
import { gmailAuth, createGoogleClient } from '../auth';
import { gmail as googleGmail } from '@googleapis/gmail';

export const gmailListHistoryAction = createAction({
  auth: gmailAuth,
  name: 'gmail_list_history',
  displayName: 'List History',
  description: 'List mailbox changes since a given history ID.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Returns the incremental change log (messages added, deleted, or relabeled) since a given starting history ID. Use this to detect what changed in the mailbox since a previous checkpoint; obtain the starting history ID from Get Profile (or a prior run). Idempotent: a read-only listing that does not modify the mailbox.',
    idempotent: true,
  },
  props: {
    start_history_id: Property.ShortText({
      displayName: 'Start History ID',
      description:
        'Return changes after this history ID (obtain from Get Profile or a previous history result).',
      required: true,
    }),
    history_types: Property.StaticMultiSelectDropdown({
      displayName: 'History Types',
      description: 'Limit results to these change types (leave empty for all).',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'Message Added', value: 'messageAdded' },
          { label: 'Message Deleted', value: 'messageDeleted' },
          { label: 'Label Added', value: 'labelAdded' },
          { label: 'Label Removed', value: 'labelRemoved' },
        ],
      },
    }),
    max_results: Property.Number({
      displayName: 'Max Results',
      description: 'Maximum number of history records to return (1-500).',
      required: false,
      defaultValue: 100,
    }),
  },
  async run(context) {
    const authClient = await createGoogleClient(context.auth);
    const gmail = googleGmail({ version: 'v1', auth: authClient });

    const maxResults = Math.min(
      Math.max(context.propsValue.max_results || 100, 1),
      500
    );
    const historyTypes = context.propsValue.history_types as
      | string[]
      | undefined;

    try {
      const response = await gmail.users.history.list({
        userId: 'me',
        startHistoryId: context.propsValue.start_history_id,
        maxResults,
        ...(historyTypes && historyTypes.length > 0 ? { historyTypes } : {}),
      });
      return response.data;
    } catch (error: any) {
      if (error.code === 403) {
        throw new Error(
          'Insufficient permissions to read history. Ensure the gmail.readonly scope is granted.'
        );
      } else if (error.code === 404) {
        throw new Error(
          'The start history ID is too old or invalid. Fetch a fresh history ID from Get Profile.'
        );
      } else if (error.code === 429) {
        throw new Error(
          'Gmail API rate limit exceeded. Please try again later.'
        );
      }
      throw new Error(`Failed to list history: ${error.message}`);
    }
  },
});
