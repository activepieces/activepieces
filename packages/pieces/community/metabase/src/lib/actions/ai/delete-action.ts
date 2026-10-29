import { createAction } from '@activepieces/pieces-framework';
import { metabaseAiProps } from '../../ai-props';
import { metabaseApi } from '../../api';
import { metabaseAuth } from '../../auth';
import { metabaseDeleteActionOutputSchema } from '../../output-schemas';

export const deleteActionAction = createAction({
  auth: metabaseAuth,
  name: 'metabase_delete_action',
  outputSchema: metabaseDeleteActionOutputSchema,
  displayName: 'Delete Action',
  description: 'Permanently delete a Metabase action.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description:
      'Permanently deletes a Metabase action. To hide it instead (recoverable), use Update Action with Archived = Yes.',
    idempotent: false,
  },
  props: {
    actionId: metabaseAiProps.actionId({ required: true }),
  },
  async run({ auth, propsValue }) {
    await metabaseApi.deleteAction({
      auth,
      actionId: propsValue.actionId,
    });
    return { deleted: true, actionId: propsValue.actionId };
  },
});
