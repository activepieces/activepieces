import { createAction, MarkdownVariant, Property } from '@activepieces/pieces-framework';
import { cognitoFormsAuth } from '../auth';
import { deleteEntry } from '../common/delete';
import { entryIdInput, formIdDropdown } from '../common/props';
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
    deleteWarning: Property.MarkDown({
      value: 'Deleting an entry is permanent and cannot be undone.',
      variant: MarkdownVariant.WARNING,
    }),
    formId: formIdDropdown,
    entryId: entryIdInput,
  },
  async run(context) {
    const { formId, entryId } = context.propsValue;
    return deleteEntry({ apiKey: context.auth.secret_text, formId, entryId });
  },
});
