import { createAction } from '@activepieces/pieces-framework';
import { cognitoFormsAuth } from '../auth';
import { deleteEntry } from '../common/delete';
import { entryIdText, formIdDropdown } from '../common/props';
import { deleteEntryOutputSchema } from '../output-schemas';

export const deleteEntryAction = createAction({
  auth: cognitoFormsAuth,
  name: 'delete_entry',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Entry',
  description: 'Permanently deletes an entry. Entries that are already gone are reported as already deleted.',
  audience: 'human',
  aiMetadata: {
    description: 'Permanently deletes one Cognito Forms entry by form and entry ID. Idempotent: deleting an entry that no longer exists succeeds with already_deleted true.',
    idempotent: true,
  },
  outputSchema: deleteEntryOutputSchema,
  props: {
    formId: formIdDropdown,
    entryId: entryIdText('The entry number (for example 12) or the full entry ID (for example 5-12) of the entry to delete.'),
  },
  async run(context) {
    const { formId, entryId } = context.propsValue;
    return deleteEntry({ apiKey: context.auth.secret_text, formId, entryId });
  },
});
