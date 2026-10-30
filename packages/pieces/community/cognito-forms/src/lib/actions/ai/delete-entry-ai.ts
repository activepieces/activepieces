import { createAction } from '@activepieces/pieces-framework';
import { cognitoFormsAuth } from '../../auth';
import { deleteEntry } from '../../common/delete';
import { entryIdText, formIdText } from '../../common/props';
import { deleteEntryOutputSchema } from '../../output-schemas';

export const deleteEntryAiAction = createAction({
  auth: cognitoFormsAuth,
  name: 'delete_entry_ai',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Entry (by IDs)',
  description: 'Permanently deletes an entry from a form ID and an entry ID.',
  audience: 'ai',
  aiMetadata: {
    description: 'Permanently deletes one Cognito Forms entry by form ID and entry number or ID. Cannot be undone. Idempotent: if the entry is already gone the call succeeds with already_deleted true.',
    idempotent: true,
  },
  outputSchema: deleteEntryOutputSchema,
  props: {
    form_id: formIdText,
    entry_id: entryIdText('The entry number (for example 12) or the full entry ID (for example 5-12).'),
  },
  async run(context) {
    const { form_id, entry_id } = context.propsValue;
    return deleteEntry({ apiKey: context.auth.secret_text, formId: form_id, entryId: entry_id });
  },
});
