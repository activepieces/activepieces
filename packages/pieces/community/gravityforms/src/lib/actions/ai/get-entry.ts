import { createAction } from '@activepieces/pieces-framework';
import { gravityFormsAuth } from '../../auth';
import { gravityFormsAiProps } from '../../common/ai-props';
import { gravityFormsApi } from '../../common/api';
import { gravityformsGetEntryOutputSchema } from '../../output-schemas';

export const getEntryAction = createAction({
  auth: gravityFormsAuth,
  name: 'gravityforms_get_entry',
  outputSchema: gravityformsGetEntryOutputSchema,
  displayName: 'Get Entry',
  description: 'Gets one entry with its field values.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Gets one entry by id: its properties (form_id, status, date_created, payment fields) and field values keyed by field id. Entry ids come from List Entries or Create Entry.',
    idempotent: true,
  },
  props: {
    entryId: gravityFormsAiProps.entryId({ required: true }),
  },
  async run(context) {
    return await gravityFormsApi.getEntry({ auth: context.auth, entryId: context.propsValue.entryId });
  },
});
